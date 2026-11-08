#include <windows.h>

#include <cstdarg>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>

#include "embedded_hud.h"

#if defined(_MSC_VER)
#define RADMIR_FASTCALL __fastcall
using ExecuteScriptFn = void(__fastcall*)(void* view, void* unused, const char* script);
#else
#define RADMIR_FASTCALL __attribute__((fastcall))
using ExecuteScriptFn = void(__attribute__((fastcall))*)(void* view, void* unused, const char* script);
#endif

namespace {

HMODULE g_module = nullptr;
volatile LONG g_reload = 0;
volatile LONG g_injected = 0;
volatile LONG g_injecting = 0;
volatile LONG g_hooked = 0;
volatile LONG g_executeCount = 0;
volatile LONG g_debugMode = 0;
void* g_uiView = nullptr;
void* g_originalExecuteScript = nullptr;

struct PeSection {
  uint8_t* base;
  size_t size;
};

void RADMIR_FASTCALL DetourExecuteScript(void* view, void* unused, const char* script);

void Log(const char* message) {
  if (!message || !g_module) {
    return;
  }

  char path[MAX_PATH] = {};
  const DWORD length = GetModuleFileNameA(g_module, path, MAX_PATH);
  if (length == 0 || length >= MAX_PATH) {
    return;
  }

  for (DWORD index = length; index > 0; --index) {
    if (path[index - 1] == '\\' || path[index - 1] == '/') {
      path[index] = '\0';
      break;
    }
  }

  if (std::strlen(path) + 14 >= MAX_PATH) {
    return;
  }
  std::strcat(path, "RadmirHud.log");

  const HANDLE file = CreateFileA(
      path,
      FILE_APPEND_DATA,
      FILE_SHARE_READ | FILE_SHARE_WRITE,
      nullptr,
      OPEN_ALWAYS,
      FILE_ATTRIBUTE_NORMAL,
      nullptr);
  if (file == INVALID_HANDLE_VALUE) {
    return;
  }

  char line[768] = {};
  std::snprintf(line, sizeof(line), "[%lu] %s\r\n", GetTickCount(), message);
  DWORD written = 0;
  WriteFile(file, line, static_cast<DWORD>(std::strlen(line)), &written, nullptr);
  CloseHandle(file);
}

void Logf(const char* format, ...) {
  char message[640] = {};
  va_list args;
  va_start(args, format);
  std::vsnprintf(message, sizeof(message), format, args);
  va_end(args);
  Log(message);
}

std::string ModuleDirectory() {
  char path[MAX_PATH] = {};
  const DWORD length = GetModuleFileNameA(g_module, path, MAX_PATH);
  if (length == 0 || length >= MAX_PATH) {
    return {};
  }

  for (DWORD index = length; index > 0; --index) {
    if (path[index - 1] == '\\' || path[index - 1] == '/') {
      path[index] = '\0';
      break;
    }
  }

  return path;
}

std::string ReadFileBytes(const std::string& path) {
  const HANDLE file = CreateFileA(
      path.c_str(),
      GENERIC_READ,
      FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
      nullptr,
      OPEN_EXISTING,
      FILE_ATTRIBUTE_NORMAL,
      nullptr);
  if (file == INVALID_HANDLE_VALUE) {
    return {};
  }

  const DWORD size = GetFileSize(file, nullptr);
  if (size == INVALID_FILE_SIZE || size == 0 || size > 32 * 1024 * 1024) {
    CloseHandle(file);
    return {};
  }

  std::string data(size, '\0');
  DWORD read = 0;
  const BOOL ok = ReadFile(file, data.data(), size, &read, nullptr);
  CloseHandle(file);

  if (!ok || read == 0) {
    return {};
  }

  data.resize(read);
  return data;
}

std::string LoadHudSource() {
  const std::string directory = ModuleDirectory();
  if (!directory.empty()) {
    const std::string besidePath = directory + "hud.inject.js";
    const std::string beside = ReadFileBytes(besidePath);
    if (!beside.empty()) {
      Logf("using external bundle: %s", besidePath.c_str());
      InterlockedExchange(&g_debugMode, 1);
      return beside;
    }

    const std::string scriptsPath = directory + "scripts\\hud.inject.js";
    const std::string scripts = ReadFileBytes(scriptsPath);
    if (!scripts.empty()) {
      Logf("using external bundle: %s", scriptsPath.c_str());
      InterlockedExchange(&g_debugMode, 1);
      return scripts;
    }
  }

  Log("using embedded bundle");
  return std::string(reinterpret_cast<const char*>(kEmbeddedHud), kEmbeddedHudSize);
}

bool DebugMarkerExists() {
  const std::string directory = ModuleDirectory();
  if (directory.empty()) {
    return false;
  }

  const std::string marker = directory + "RadmirHud.debug";
  const DWORD attributes = GetFileAttributesA(marker.c_str());
  return attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_DIRECTORY) == 0;
}

const char* DiagnosticBootstrap() {
  return R"JS((function(){
    if(window.__radmirHudDiagnosticInstalled){return;}
    window.__radmirHudDiagnosticInstalled=true;
    var panel=null;
    function report(message,visible){
      try{
        if(!document.body){return;}
        if(!panel){
          panel=document.createElement('div');
          panel.id='radmir-hud-diagnostic';
          panel.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2147483647;max-width:70vw;padding:8px 12px;background:rgba(24,8,16,.96);border:1px solid #ff5277;color:#fff;font:14px/1.4 Arial,sans-serif;white-space:pre-wrap;pointer-events:none';
          document.body.appendChild(panel);
        }
        panel.textContent='RADMIR HUD DIAGNOSTIC\n'+String(message).slice(0,1800);
        panel.style.display=visible===false?'none':'block';
      }catch(ignore){}
    }
    window.__radmirHudReport=report;
    window.addEventListener('error',function(event){report('JAVASCRIPT ERROR: '+(event.message||event.type)+'\n'+(event.filename||'')+':'+(event.lineno||0),true);});
    window.addEventListener('unhandledrejection',function(event){report('PROMISE ERROR: '+(event.reason&&event.reason.stack||event.reason||'unknown'),true);});
    report('Bundle evaluated; waiting for the game Hud interface trigger.',true);
    window.setTimeout(function(){
      if(panel&&panel.textContent.indexOf('Bundle evaluated')===0){panel.style.display='none';}
    },15000);
  })();)JS";
}

bool GetSection(HMODULE module, const char* name, PeSection* out) {
  if (!module || !name || !out) {
    return false;
  }

  auto* base = reinterpret_cast<uint8_t*>(module);
  const auto* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(base);
  if (dos->e_magic != IMAGE_DOS_SIGNATURE) {
    return false;
  }

  const auto* nt = reinterpret_cast<IMAGE_NT_HEADERS32*>(base + dos->e_lfanew);
  if (nt->Signature != IMAGE_NT_SIGNATURE) {
    return false;
  }

  const auto* sections = IMAGE_FIRST_SECTION(nt);
  for (WORD index = 0; index < nt->FileHeader.NumberOfSections; ++index) {
    const char* sectionName = reinterpret_cast<const char*>(sections[index].Name);
    if (std::strncmp(sectionName, name, 8) == 0) {
      out->base = base + sections[index].VirtualAddress;
      out->size = sections[index].Misc.VirtualSize;
      return out->size != 0;
    }
  }

  return false;
}

bool IsWithin(const PeSection& section, uintptr_t address) {
  if (!section.base || section.size == 0) {
    return false;
  }

  const uintptr_t start = reinterpret_cast<uintptr_t>(section.base);
  return address >= start && address < start + section.size;
}

uint8_t* FindExecuteScript(HMODULE module) {
  PeSection text = {};

  if (GetSection(module, ".text", &text)) {
    static const uint8_t pattern[] = {
        0x55, 0x8B, 0xEC, 0x83, 0xE4, 0xF8, 0x83, 0xEC, 0x44,
        0x53, 0x56, 0x8B, 0xF1, 0x8D, 0x4C, 0x24, 0x0B, 0x57,
    };
    constexpr size_t patternSize = sizeof(pattern);

    if (text.size >= patternSize) {
      for (size_t offset = 0; offset + patternSize <= text.size; ++offset) {
        if (std::memcmp(text.base + offset, pattern, patternSize) == 0) {
          return text.base + offset;
        }
      }
    }
  }

  auto* base = reinterpret_cast<uint8_t*>(module);
  const auto* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(base);
  if (dos->e_magic != IMAGE_DOS_SIGNATURE) {
    return nullptr;
  }

  const auto* nt = reinterpret_cast<IMAGE_NT_HEADERS32*>(base + dos->e_lfanew);
  if (nt->Signature != IMAGE_NT_SIGNATURE) {
    return nullptr;
  }

  constexpr uintptr_t fallbackRva = 0xE3CA6;
  if (fallbackRva + 3 >= nt->OptionalHeader.SizeOfImage) {
    return nullptr;
  }

  uint8_t* fallback = base + fallbackRva;
  if (fallback[0] == 0x55 && fallback[1] == 0x8B && fallback[2] == 0xEC) {
    Log("ExecuteScript signature scan failed; using known RVA fallback");
    return fallback;
  }

  return nullptr;
}

bool PatchExecuteScriptVtable(HMODULE module, uint8_t* function) {
  PeSection rdata = {};
  PeSection text = {};

  if (!GetSection(module, ".rdata", &rdata)) {
    return false;
  }

  GetSection(module, ".text", &text);

  const uintptr_t target = reinterpret_cast<uintptr_t>(function);
  void** slot = nullptr;

  for (size_t offset = 0; offset + sizeof(uintptr_t) <= rdata.size; offset += sizeof(uintptr_t)) {
    auto* candidate = reinterpret_cast<uintptr_t*>(rdata.base + offset);
    if (*candidate != target) {
      continue;
    }

    bool leftOk = true;
    bool rightOk = true;

    if (offset >= sizeof(uintptr_t)) {
      leftOk = IsWithin(text, *(candidate - 1));
    }
    if (offset + sizeof(uintptr_t) * 2 <= rdata.size) {
      rightOk = IsWithin(text, *(candidate + 1));
    }

    if (leftOk && rightOk) {
      slot = reinterpret_cast<void**>(candidate);
      break;
    }

    if (!slot) {
      slot = reinterpret_cast<void**>(candidate);
    }
  }

  if (!slot) {
    auto* base = reinterpret_cast<uint8_t*>(module);
    auto* fallbackSlot = reinterpret_cast<void**>(base + 0x45352C);
    if (IsWithin(rdata, reinterpret_cast<uintptr_t>(fallbackSlot))) {
      slot = fallbackSlot;
      Log("vtable scan failed; using known slot RVA fallback");
    }
  }

  if (!slot) {
    return false;
  }

  if (reinterpret_cast<uintptr_t>(*slot) == reinterpret_cast<uintptr_t>(&DetourExecuteScript)) {
    return false;
  }

  const uintptr_t current = reinterpret_cast<uintptr_t>(*slot);
  if (current == reinterpret_cast<uintptr_t>(function)) {
    Logf("vtable slot located: %p", slot);
  }

  g_originalExecuteScript = reinterpret_cast<void*>(*slot);

  DWORD previousProtect = 0;
  if (!VirtualProtect(slot, sizeof(void*), PAGE_EXECUTE_READWRITE, &previousProtect)) {
    Logf("VirtualProtect(vtable) failed: %lu", GetLastError());
    return false;
  }

  *slot = reinterpret_cast<void*>(&DetourExecuteScript);
  DWORD ignored = 0;
  VirtualProtect(slot, sizeof(void*), previousProtect, &ignored);
  FlushInstructionCache(GetCurrentProcess(), slot, sizeof(void*));

  Logf(
      "vtable patched: slot=%p original=%p detour=%p",
      slot,
      g_originalExecuteScript,
      reinterpret_cast<void*>(&DetourExecuteScript));

  return true;
}

bool LooksLikeUiScript(const char* script) {
  if (!script) {
    return false;
  }

  return std::strstr(script, "Hud") != nullptr ||
         std::strstr(script, "getInterface") != nullptr ||
         std::strstr(script, "interface(") != nullptr;
}

bool ShouldInject(void* view, const char* script) {
  if (InterlockedCompareExchange(&g_injected, 0, 0) != 0) {
    return false;
  }

  if (g_uiView == nullptr) {
    if (LooksLikeUiScript(script)) {
      void* previous = InterlockedCompareExchangePointer(
          reinterpret_cast<PVOID volatile*>(&g_uiView), view, nullptr);
      if (previous == nullptr) {
        Logf("UI view detected: %p", view);
      }
      return previous == nullptr || previous == view;
    }

    if (InterlockedCompareExchange(&g_executeCount, 0, 0) >= 80) {
      void* previous = InterlockedCompareExchangePointer(
          reinterpret_cast<PVOID volatile*>(&g_uiView), view, nullptr);
      if (previous == nullptr) {
        Logf("UI view fallback: %p", view);
      }
      return previous == nullptr || previous == view;
    }

    return false;
  }

  return g_uiView == view;
}

void InjectIntoView(void* view) {
  if (!view || !g_originalExecuteScript) {
    return;
  }

  if (InterlockedCompareExchange(&g_injecting, 1, 0) != 0) {
    return;
  }

  std::string source = LoadHudSource();
  if (source.empty()) {
    Log("injection skipped: empty bundle");
    InterlockedExchange(&g_injecting, 0);
    return;
  }

  auto original = reinterpret_cast<ExecuteScriptFn>(g_originalExecuteScript);
  const bool debug = InterlockedCompareExchange(&g_debugMode, 0, 0) != 0 || DebugMarkerExists();
  if (debug) {
    original(view, nullptr, DiagnosticBootstrap());
  }

  source += "\n//# sourceURL=radmir-hud.inject.js\n";

  Logf("injecting %u bytes into view %p", static_cast<unsigned>(source.size()), view);
  original(view, nullptr, source.c_str());

  InterlockedExchange(&g_injected, 1);
  InterlockedExchange(&g_reload, 0);
  Log("injection call completed");
  InterlockedExchange(&g_injecting, 0);
}

void RADMIR_FASTCALL DetourExecuteScript(void* view, void* unused, const char* script) {
  const LONG count = InterlockedIncrement(&g_executeCount);

  if (view && script && count <= 8) {
    Logf("ExecuteScript #%ld view=%p", count, view);
  }

  if (view && script) {
    if (InterlockedCompareExchange(&g_reload, 0, 0) != 0) {
      InterlockedExchange(&g_reload, 0);
      Log("reloading HUD");
      InjectIntoView(view);
    } else if (InterlockedCompareExchange(&g_injected, 0, 0) == 0 && ShouldInject(view, script)) {
      InjectIntoView(view);
    }
  }

  auto original = reinterpret_cast<ExecuteScriptFn>(g_originalExecuteScript);
  if (original) {
    original(view, unused, script);
  }
}

bool InstallHook() {
  if (InterlockedCompareExchange(&g_hooked, 0, 0) != 0) {
    return true;
  }

  const HMODULE cohtml = GetModuleHandleA("cohtml.WindowsDesktop.dll");
  if (!cohtml) {
    return false;
  }

  uint8_t* function = FindExecuteScript(cohtml);
  if (!function) {
    return false;
  }

  if (!PatchExecuteScriptVtable(cohtml, function)) {
    return false;
  }

  InterlockedExchange(&g_hooked, 1);
  Logf("hook installed: ExecuteScript=%p", function);
  return true;
}

DWORD WINAPI Worker(LPVOID) {
  Log("worker start");

  int attempts = 0;
  while (InterlockedCompareExchange(&g_hooked, 0, 0) == 0) {
    if (InstallHook()) {
      break;
    }

    attempts += 1;
    if (attempts == 1 || attempts % 100 == 0) {
      Logf("waiting for cohtml.WindowsDesktop.dll / ExecuteScript (attempt %d)", attempts);
    }

    Sleep(50);
  }

  Log("hook ready; F10 reloads the HUD bundle");

  bool f10WasDown = false;
  DWORD lastReloadTick = 0;
  for (;;) {
    const bool f10Down = (GetAsyncKeyState(VK_F10) & 0x8000) != 0;
    if (f10Down && !f10WasDown) {
      const DWORD now = GetTickCount();
      if (now - lastReloadTick >= 1000) {
        InterlockedExchange(&g_reload, 1);
        lastReloadTick = now;
        Log("F10 pressed: reload queued");
      }
    }
    f10WasDown = f10Down;
    Sleep(40);
  }
}

}  // namespace

BOOL WINAPI DllMain(HINSTANCE instance, DWORD reason, LPVOID) {
  if (reason == DLL_PROCESS_ATTACH) {
    g_module = instance;
    DisableThreadLibraryCalls(instance);

    const HANDLE thread = CreateThread(nullptr, 0, Worker, nullptr, 0, nullptr);
    if (thread) {
      CloseHandle(thread);
    }
  }

  return TRUE;
}
