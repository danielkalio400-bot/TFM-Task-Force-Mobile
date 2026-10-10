export class MapCatalogService {
  constructor(catalog) {
    this.catalog = catalog;
  }

  list(section) {
    const maps = this.catalog?.maps || [];
    if (!section) return maps.map(map => ({ ...map }));
    return maps.filter(map => map.section === section).map(map => ({ ...map }));
  }

  get(mapId) {
    const map = (this.catalog?.maps || []).find(entry => entry.id === mapId);
    return map ? { ...map } : null;
  }

  supports(mapId, section) {
    const map = this.get(mapId);
    return Boolean(map && map.section === section);
  }
}
