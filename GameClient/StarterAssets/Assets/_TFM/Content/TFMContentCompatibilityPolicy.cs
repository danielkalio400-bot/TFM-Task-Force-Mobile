using System;
using System.Collections.Generic;

namespace TFM.Content
{
    public sealed class TFMContentCompatibilityPolicy
    {
        public TFMContentCompatibilityReport Evaluate(
            string clientVersion,
            int supportedManifestVersion,
            int manifestVersion,
            IEnumerable<TFMContentInstallState> packs,
            IEnumerable<string> requiredPackIds)
        {
            var missing = new List<string>();
            var byId = new Dictionary<string, TFMContentInstallState>(StringComparer.Ordinal);

            if (packs != null)
            {
                foreach (var pack in packs)
                {
                    if (pack != null && !string.IsNullOrWhiteSpace(pack.PackId))
                        byId[pack.PackId] = pack;
                }
            }

            if (requiredPackIds != null)
            {
                foreach (var id in requiredPackIds)
                {
                    if (string.IsNullOrWhiteSpace(id)) continue;
                    if (!byId.TryGetValue(id, out var state) ||
                        state.State != TFMContentPackState.Installed)
                        missing.Add(id);
                }
            }

            var report = new TFMContentCompatibilityReport
            {
                ClientVersion = clientVersion ?? string.Empty,
                ManifestVersion = manifestVersion,
                MissingOrOutdatedPackIds = missing.ToArray()
            };

            if (manifestVersion > supportedManifestVersion)
            {
                report.State = TFMContentCompatibilityState.ManifestUnsupported;
                report.MessageKey = "content.manifest_unsupported";
            }
            else if (missing.Count > 0)
            {
                report.State = TFMContentCompatibilityState.ContentUpdateRequired;
                report.MessageKey = "content.update_required";
            }
            else
            {
                report.State = TFMContentCompatibilityState.Compatible;
                report.MessageKey = "content.compatible";
            }

            return report;
        }
    }
}
