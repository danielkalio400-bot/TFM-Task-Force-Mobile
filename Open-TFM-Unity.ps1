#requires -Version 5.1
[CmdletBinding()]
param(
    [string] $Root = $PSScriptRoot,
    [string] $ProjectPath,
    [string] $UnityEditorPath
)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'Update-TFM-Unity.ps1') -Root $Root -ProjectPath $ProjectPath -UnityEditorPath $UnityEditorPath -LaunchOnly
