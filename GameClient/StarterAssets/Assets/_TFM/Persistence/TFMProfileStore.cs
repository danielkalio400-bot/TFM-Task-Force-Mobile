using System;
using System.IO;
using UnityEngine;

namespace TFM.Persistence
{
    public static class TFMProfileStore
    {
        private const string FileName = "tfm-local-profile.json";

        public static string FilePath => Path.Combine(Application.persistentDataPath, FileName);

        public static void Save(TFMPlayerProfileData profile)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            profile.Normalize();

            string json = JsonUtility.ToJson(profile, true);
            string temporary = FilePath + ".tmp";
            File.WriteAllText(temporary, json);

            if (File.Exists(FilePath))
            {
                File.Delete(FilePath);
            }

            File.Move(temporary, FilePath);
        }

        public static TFMPlayerProfileData LoadOrCreate()
        {
            if (!File.Exists(FilePath))
            {
                return CreateNew();
            }

            try
            {
                string json = File.ReadAllText(FilePath);
                TFMPlayerProfileData profile = JsonUtility.FromJson<TFMPlayerProfileData>(json);
                if (profile == null) return CreateNew();
                profile.Normalize();
                return profile;
            }
            catch (Exception exception)
            {
                Debug.LogWarning($"TFM local profile could not be loaded: {exception.Message}");
                return CreateNew();
            }
        }

        private static TFMPlayerProfileData CreateNew()
        {
            return new TFMPlayerProfileData
            {
                localProfileId = Guid.NewGuid().ToString("N")
            };
        }
    }
}
