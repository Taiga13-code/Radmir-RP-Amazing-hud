@echo off
setlocal
cd /d "%~dp0"

if not exist "src\embedded_hud.h" (
  echo Run this first from C:\eradmir : npm run build:inject
  exit /b 1
)

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "VSROOT="
if exist "%VSWHERE%" (
  for /f "usebackq delims=" %%I in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSROOT=%%I"
)

if defined VSROOT (
  call "%VSROOT%\VC\Auxiliary\Build\vcvarsall.bat" x86
  if errorlevel 1 exit /b 1
  cl /nologo /LD /MT /O2 /GS- /EHsc /std:c++17 /D_CRT_SECURE_NO_WARNINGS src\dllmain.cpp /Fo:src\ /Fe:RadmirHud.asi /link /MACHINE:X86 user32.lib kernel32.lib
  if errorlevel 1 exit /b 1
  echo Built: %~dp0RadmirHud.asi
  exit /b 0
)

set "CXX=C:\eradmir\.tools\llvm-mingw\llvm-mingw-20261104-msvcrt-i686\bin\i686-w64-mingw32-clang++.exe"
if not exist "%CXX%" set "CXX="
if not defined CXX (
  echo No 32-bit C++ compiler found.
  echo Expected either MSVC x86 or C:\eradmir\.tools\llvm-mingw with i686 clang++.
  exit /b 1
)

"%CXX%" -shared -static -O2 -std=c++17 -o RadmirHud.asi src\dllmain.cpp -luser32 -lkernel32 -Wl,--kill-at
if errorlevel 1 exit /b 1
echo Built: %~dp0RadmirHud.asi
exit /b 0
