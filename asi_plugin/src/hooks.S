.intel_syntax noprefix
.text

.globl _HookedScriptRun
.globl _HookedNavigate
.globl _HookedDomBuilt
.globl _HookedContextCreated

.extern _RadmirRememberContext
.extern _RadmirNoteUrl
.extern _RadmirMarkUiReady
.extern _RadmirInjectIfNeeded
.extern _g_originalRun
.extern _g_originalNavigate
.extern _g_originalDomBuilt
.extern _g_originalContextCreated

_HookedScriptRun:
    push ecx
    push dword ptr [esp + 12]
    call _RadmirRememberContext
    add esp, 4
    pop ecx
    push dword ptr [esp + 8]
    push dword ptr [esp + 8]
    mov eax, dword ptr [_g_originalRun]
    call eax
    push eax
    call _RadmirInjectIfNeeded
    pop eax
    ret 8

_HookedNavigate:
    push ecx
    push dword ptr [esp + 8]
    call _RadmirNoteUrl
    add esp, 4
    pop ecx
    mov eax, dword ptr [_g_originalNavigate]
    jmp eax

_HookedDomBuilt:
    push ecx
    call _RadmirMarkUiReady
    pop ecx
    mov eax, dword ptr [_g_originalDomBuilt]
    jmp eax

_HookedContextCreated:
    push ecx
    call _RadmirMarkUiReady
    pop ecx
    mov eax, dword ptr [_g_originalContextCreated]
    jmp eax
