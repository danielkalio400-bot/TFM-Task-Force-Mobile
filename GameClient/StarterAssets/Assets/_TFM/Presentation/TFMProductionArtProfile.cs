using UnityEngine;

namespace TFM.Presentation
{
    // Assign original or properly licensed, URP-ready prefabs here in Unity.
    // A source-only repository does not imply that production art is installed.
    [CreateAssetMenu(fileName = "TFMProductionArtProfile",
        menuName = "TFM/Production Art Profile")]
    public sealed class TFMProductionArtProfile : ScriptableObject
    {
        [Header("Humanoid")]
        [SerializeField] private GameObject operatorPrefab;
        [Header("Complete training environment (including physical colliders)")]
        [SerializeField] private GameObject environmentPrefab;
        [Header("Physical practice target, with colliders")]
        [SerializeField] private GameObject practiceTargetPrefab;

        public GameObject OperatorPrefab => operatorPrefab;
        public GameObject EnvironmentPrefab => environmentPrefab;
        public GameObject PracticeTargetPrefab => practiceTargetPrefab;
    }
}
