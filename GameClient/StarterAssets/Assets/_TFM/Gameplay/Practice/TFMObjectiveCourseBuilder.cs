using System.Collections.Generic;
using UnityEngine;

namespace TFM.Gameplay.Practice
{
    /// <summary>
    /// Runtime-only original path markers. Kept separate from the original
    /// saved Unity yard; no PlayerPrefs map edits or scene overwrites.
    /// </summary>
    public static class TFMObjectiveCourseBuilder
    {
        private static readonly Vector3[] Course = {
            new Vector3(-10f, 0f, -7f),
            new Vector3(-10f, 0f, 6f),
            new Vector3(-1f, 0f, 11f),
            new Vector3(10f, 0f, 10f),
            new Vector3(10f, 0f, -6f)
        };

        public static TFMObjectiveWaypoint[] Build(Transform root)
        {
            var result = new List<TFMObjectiveWaypoint>();
            GameObject folder = new GameObject("Original Waypoint Practice Course");
            folder.transform.SetParent(root, false);
            for (int i = 0; i < Course.Length; i++)
            {
                GameObject marker = new GameObject("Waypoint " + (i + 1));
                marker.transform.SetParent(folder.transform, false);
                marker.transform.localPosition = Course[i];

                GameObject column = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                column.name = "Visual Beacon";
                column.transform.SetParent(marker.transform, false);
                column.transform.localPosition = new Vector3(0f, 1.15f, 0f);
                column.transform.localScale = new Vector3(0.18f, 1f, 0.18f);
                Collider collider = column.GetComponent<Collider>();
                if (collider != null) Object.Destroy(collider);
                TFMObjectiveWaypoint waypoint = marker.AddComponent<TFMObjectiveWaypoint>();
                waypoint.Configure(i, 2f);
                waypoint.Show(false);
                result.Add(waypoint);
            }
            return result.ToArray();
        }
    }
}
