#requires -Version 5.1
[CmdletBinding()]
param(
    [string] $Root = $PSScriptRoot,
    [string] $ProjectPath,
    [switch] $Preview
)
$ErrorActionPreference = 'Stop'

# Use the same project selection, backups and verification as online updates.
& (Join-Path $PSScriptRoot 'Update-TFM-Unity.ps1') -Root $Root -ProjectPath $ProjectPath -SourceRoot $Root -Preview:$Preview
