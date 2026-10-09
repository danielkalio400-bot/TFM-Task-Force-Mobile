# Create the REAL Unity project via Unity Hub

Unity Hub -> New project -> Unity 6 LTS -> Universal 3D template.
Set the project location to GameClient/TFM-Unity.
Do not create a project using the Built-In or HDRP template.

This scaffold intentionally does not fabricate Unity's Packages/manifest.json,
ProjectSettings, URP assets or Unity .meta files. Unity Hub is responsible for
creating those files with versions that match the installed editor.

Then run ../Import-TFM-StarterAssets.ps1 from the TFM repository root to copy
StarterAssets into TFM-Unity/Assets/_TFM. Existing assets are never overwritten.

The C# examples provide a menu/mode data model and a basic startup marker;
they do not implement gameplay, authentication or multiplayer.