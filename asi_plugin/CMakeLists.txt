cmake_minimum_required(VERSION 3.20)
project(RadmirHud LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(RadmirHud SHARED src/dllmain.cpp)
set_target_properties(RadmirHud PROPERTIES SUFFIX ".asi" OUTPUT_NAME "RadmirHud" PREFIX "")

if(MSVC)
  target_compile_options(RadmirHud PRIVATE /W4 /EHsc /MT /GS- /DUNICODE /D_UNICODE /D_CRT_SECURE_NO_WARNINGS)
  target_link_options(RadmirHud PRIVATE /MACHINE:X86)
endif()

target_link_libraries(RadmirHud PRIVATE user32 kernel32)
