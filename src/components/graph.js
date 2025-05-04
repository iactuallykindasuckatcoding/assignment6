import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getNodes } from "../utils/getNodes";
import { getLinks } from "../utils/getLinks";
import { drag } from "../utils/drag";

export const Graph = ({ data, svg_width, svg_height, margin }) => {
    const d3Selection = useRef();

    useEffect(() => {
        const nodes = getNodes(data);
        const links = getLinks(data);

        const radius = d3.scaleSqrt()
        .domain([0, 200])
        .range([2, 14]); 
      

        const lineWidth = d3.scaleSqrt()
            .domain([1, d3.max(links, d => d.value)])
            .range([1, 10]);

        const color = d3.scaleOrdinal()
            .domain(["heartDisease", "ever_married", "never_married", "hypertension", "male", "female", "stroke"])
            .range(["#377eb8", "#ff7f00", "#4daf4a", "#e41a1c", "#984ea3", "#a65628", "#f781bf"]);
          

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20 / d.value))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(svg_width / 2, svg_height / 2))
            .force("y", d3.forceY([svg_height / 2]).strength(0.02))
            .force("collide", d3.forceCollide().radius(d => radius(d.value) + 20))
            .tick(3000);

        const g = d3.select(d3Selection.current);
        g.selectAll("*").remove(); // ✅ clear on rerender

        // Reuse or create tooltip
        const tooltip = d3.select("body").selectAll(".tooltip").data([null])
            .join("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid gray")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => lineWidth(d.value));

        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", d => radius(d.value))
            .attr("fill", d => color(d.name))
            .call(drag(simulation))
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(d.name)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, 0)`);

        const legendItems = [...new Set(nodes.map(d => d.name))];

        legend.selectAll("rect")
            .data(legendItems)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => color(d));

        legend.selectAll("text")
            .data(legendItems)
            .enter()
            .append("text")
            .attr("x", 25)
            .attr("y", (d, i) => i * 25 + 15)
            .text(d => d)
            .style("font-size", "14px");

    }, [svg_width, svg_height, data]);

    return (
        <svg width={svg_width} height={svg_height}>
            <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`} />
        </svg>
    );
};
