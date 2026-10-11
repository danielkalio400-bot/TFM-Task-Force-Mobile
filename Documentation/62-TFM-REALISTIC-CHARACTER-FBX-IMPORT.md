# TFM realistic user-supplied character import

**Actual user asset:** `character.fbx` (116,887,024 bytes; 111.47 MiB), binary FBX 7300.

**Prepared delivery outside GitHub source:** `TFM_Character_2K.fbx` (34,139,536 bytes; 32.56 MiB). Its eight 4096-pixel embedded PNGs were resized to 2048 pixels; normals were renormalized. This is a byte-level-preserving FBX reconstruction that preserved every non-texture property, including mesh, skin and object IDs, and passed node-offset and image-decoding validation. A Unity Editor import has **not** yet been verified. Source FBX is not overwritten.

Install: copy the optimized FBX into the actual Unity project's `Assets/_TFM/Art/Characters/`, select the model, then invoke `TFM > Production Art > Configure and Assign Selected Character FBX`. If Unity reports rig errors use the FBX Rig tab to repair Humanoid mapping. Profile assignment refuses to overwrite another operator asset and only creates a missing profile once.

Textures: check Unity FBX Materials > Extract Textures if needed, then configure URP/Lit Base Maps, Normal Maps and physically appropriate smoothness. Model also has specular/glossiness textures, which may need authoring changes before URP shading behaves correctly.

Animation: import or make properly licensed/owned idle, walk, run, strafe, jump and weapon handling animations. An empty-looking FBX animation stack is **not** a playable animation guarantee. Match `TFMOperatorMotionBridge` optional parameters `Speed` (float), `IsMoving` (bool), `Grounded` (bool).

Scene: original gameplay controllers and weapon remain under the player root. Apply imported art only after the profile also contains authored environment and practice-target prefabs, then use `TFM > Production Art > Apply Imported Prefabs`. Verify orientation, scale, materials, skinned meshes, Animation Controller and target collisions.

**Not completed:** actual Unity project import, authored military costume, animation clips, environment prefab, native Android/iOS/Windows builds or mobile FPS measurements. Do not claim this is the finished character until verified in Unity. Confirm redistribution rights before publishing.
