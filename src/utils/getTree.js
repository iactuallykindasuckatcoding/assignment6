export function getTree(data, attrs) {
    const getLevels = (attr, fallbackAttr) => {
      if (attr === "_placeholder") attr = fallbackAttr;
      const attrArray = data.map(d => d[attr]);
      const levels = [...new Set(attrArray)].sort();
      return levels.map(val => ({ name: val, attr }));
    };
  
    const realAttrs = attrs.filter(a => a !== "_placeholder");
    let levels;
  
    if (realAttrs.length === 0) {
      // Use disease attribute as root level
      const diseaseAttr = "stroke"; // or pass this dynamically
      const attrArray = data.map(d => d[diseaseAttr]);
      const level = [...new Set(attrArray)].map(val => ({
        name: val,
        attr: diseaseAttr
      }));
      levels = [level];
    } else {
      levels = attrs.map((attr, idx) => {
        const fallback = idx === 0 ? realAttrs[0] : realAttrs[idx - 1] || realAttrs[0];
        return getLevels(attr, fallback);
      });
    }
  
    const getJsonTree = (data, levels) => {
      if (levels.length === 0) return null;
  
      const currentLevel = levels[0];
      const groupedNodes = [];
  
      for (const levelValue of currentLevel) {
        const filtered = data.filter(d => d[levelValue.attr] === levelValue.name);
        if (filtered.length === 0) continue;
  
        const node = {
          name: levelValue.name,
          attr: levelValue.attr,
          value: filtered.length,
          points: filtered
        };
  
        const children = getJsonTree(filtered, levels.slice(1));
        if (children) node.children = children;
  
        groupedNodes.push(node);
      }
  
      return groupedNodes;
    };
  
    return getJsonTree(data, levels);
  }
  