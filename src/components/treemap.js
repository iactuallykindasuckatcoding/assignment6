
import { useEffect, useRef } from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2, select } from "d3";

export function TreeMap({ margin, svg_width, svg_height, tree, selectedCell, setSelectedCell }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!tree || !tree.children || tree.children.length === 0) return;

    const width = svg_width;
    const height = svg_height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const root = hierarchy(tree)
      .sum(d => d.children ? 0 : d.value)
      .sort((a, b) => b.value - a.value);

    treemap()
      .size([innerWidth, innerHeight])
      .paddingInner(2)(root);

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const color = scaleOrdinal(schemeDark2);

    const firstLevelGroups = root.children;

    // Draw borders and rotated labels for top-level groups
    firstLevelGroups.forEach(d => {
      const group = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      group.append("rect")
        .attr("x", d.x0)
        .attr("y", d.y0)
        .attr("width", d.x1 - d.x0)
        .attr("height", d.y1 - d.y0)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      const cx = (d.x0 + d.x1) / 2;
      const cy = (d.y0 + d.y1) / 2;

      group.append("text")
        .attr("x", cx)
        .attr("y", cy)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#333")
        .attr("fill-opacity", 0.25)
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .attr("pointer-events", "none")
        .attr("transform", `rotate(-90, ${cx}, ${cy})`)
        .text(`${d.data.attr}: ${d.data.name}`);
    });

    // Add a line between the two top-level groups
    if (firstLevelGroups.length === 2) {
      const g1 = firstLevelGroups[0];
      const g2 = firstLevelGroups[1];
      const isVerticalSplit = Math.abs(g1.y0 - g1.y1) > Math.abs(g1.x0 - g1.x1);

      if (isVerticalSplit) {
        const y = g2.y0 + margin.top;
        svg.append("line")
          .attr("x1", g2.x0 + margin.left)
          .attr("x2", g2.x1 + margin.left)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", "white")
          .attr("stroke-width", 3);
      } else {
        const x = g2.x0 + margin.left;
        svg.append("line")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", g2.y0 + margin.top)
          .attr("y2", g2.y1 + margin.top)
          .attr("stroke", "white")
          .attr("stroke-width", 3);
      }
    }

    const nodes = g.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.ancestors()[1]?.data.name || d.data.name))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => setSelectedCell(d))
      .append("title")
      .text(d => {
        let ref = d.parent;
        while (ref && (!ref.children || ref.children.length < 2) && ref !== root) {
          ref = ref.parent;
        }
        const base = ref?.value ?? root.value;
        const percent = base > 0 ? (d.value / base * 100).toFixed(2) : "0.00";
        return `Value: ${percent}%`;
      });      

    nodes.append("text")
      .filter(d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 14)
      .attr("x", 2)
      .attr("y", 11)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(d => {
        const attr = d.data.attr === "_placeholder"
          ? (d.ancestors().find(a => a.data.attr !== "_placeholder")?.data.attr || "stroke")
          : d.data.attr;
        return `${attr}: ${d.data.name}`;
      });

      nodes.append("text")
      .filter(d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 26)
      .attr("x", 2)
      .attr("y", 22)
      .attr("fill", "white")
      .attr("font-size", "9px")
      .text(d => {
        let ref = d.parent;
        while (ref && (!ref.children || ref.children.length < 2) && ref !== root) {
          ref = ref.parent;
        }
        const base = ref?.value ?? root.value;
        const percent = base > 0 ? (d.value / base * 100).toFixed(2) : "0.00";
        return `Value: ${percent}%`;
      });
    

  }, [tree, svg_width, svg_height, margin, selectedCell, setSelectedCell]);

  return (
    <svg
      ref={svgRef}
      width={svg_width}
      height={svg_height}
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    />
  );
}