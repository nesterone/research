# Visualizations Guide

This directory contains comprehensive visualizations for the Agent vs LSP Refactoring comparison study.

## 📊 Interactive Dashboard

**File:** `visualization.html`

Open this file in a web browser to view an interactive dashboard with:
- Dynamic charts powered by Chart.js
- Hover tooltips for detailed information
- Responsive design that works on all screen sizes
- Professional color scheme matching the research theme
- Summary statistics at the top
- Key insights section with actionable recommendations

**How to use:**
```bash
# Open in default browser
open visualization.html

# Or with specific browser
firefox visualization.html
google-chrome visualization.html
```

## 📈 Static Charts

**Directory:** `charts/`

High-quality PNG images (300 DPI) suitable for:
- Embedding in documentation
- Presentations and slides
- Academic papers
- GitHub READMEs (already embedded in main README.md)

### Available Charts

1. **1_execution_time.png** (145 KB)
   - Bar chart comparing LSP vs Agent execution times
   - Shows clear performance advantage across all project sizes
   - Values labeled on each bar

2. **2_token_usage.png** (126 KB)
   - Token consumption by project size
   - Highlights that LSP uses zero tokens
   - Demonstrates cost scalability concerns

3. **3_performance_advantage.png** (127 KB)
   - LSP speed advantage as percentages
   - Shows 32%, 48%, and 95% improvements
   - Green color emphasizes positive results

4. **4_scalability.png** (208 KB)
   - Line chart showing performance vs project size
   - Demonstrates how agent overhead grows with complexity
   - LSP maintains more linear performance

5. **5_impact.png** (124 KB)
   - Files modified and occurrences changed
   - Validates 100% accuracy for both approaches
   - Shows refactoring scope across projects

6. **6_cost_comparison.png** (144 KB)
   - Cost per refactoring at $3/1M tokens
   - Makes economic case for LSP approach
   - LSP shows $0 cost vs escalating agent costs

7. **7_summary_dashboard.png** (424 KB)
   - Combined view of all key metrics
   - Perfect for presentations or overview slides
   - Includes annotated insights

## 🔄 Regenerating Charts

**Script:** `generate_charts.py`

To regenerate the charts (e.g., after data updates):

```bash
# Install dependencies
pip install matplotlib numpy

# Run the generator
python3 generate_charts.py

# Charts will be saved to ./charts/
```

### Customization

Edit `generate_charts.py` to:
- Change color schemes (modify `lsp_color` and `agent_color`)
- Adjust chart dimensions (modify `figsize` parameters)
- Change output format (PNG, SVG, PDF supported)
- Modify DPI (currently 300 for publication quality)
- Update data values if running new experiments

## 📐 Design Choices

### Color Scheme
- **LSP:** `#667eea` (Purple-blue) - Represents technology and precision
- **Agent:** `#764ba2` (Deep purple) - Represents AI/ML
- **Success/Advantage:** `#2ecc71` (Green) - Represents positive results
- **Background:** `#f8f9fa` (Light gray) - Professional, easy on eyes

### Chart Types
- **Bar charts:** For direct comparisons (time, tokens, cost)
- **Line charts:** For trends and scalability
- **Combined dashboard:** For presentations and executive summaries

### Data Visualization Principles
- Clear labels and titles
- Value annotations on bars
- Grid lines for easy reading
- Consistent color coding
- High contrast for accessibility
- Professional fonts (sans-serif)

## 💡 Usage Recommendations

### For GitHub/Documentation
- README.md already embeds the charts
- Use relative paths: `./charts/1_execution_time.png`
- Summary dashboard provides quick overview

### For Presentations
- Use `7_summary_dashboard.png` for overview slides
- Individual charts for deep dives
- Interactive HTML for live demos

### For Academic Papers
- All charts are 300 DPI (publication quality)
- Can be converted to vector formats (SVG, PDF)
- Modify script to generate grayscale versions if needed

### For Blog Posts/Articles
- Interactive HTML provides engaging experience
- Static charts load faster and work everywhere
- Summary dashboard works great as hero image

## 🔧 Technical Details

### Dependencies
- **matplotlib:** Chart generation library
- **numpy:** Numerical computing
- **Chart.js:** Interactive web charts (via CDN)

### File Sizes
- Interactive HTML: ~20 KB (loads Chart.js from CDN)
- Individual charts: 120-210 KB each
- Summary dashboard: 424 KB
- Total: ~1.3 MB for all static charts

### Browser Compatibility
Interactive dashboard works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 📊 Data Source

All visualizations are based on experimental results from:
- `results.txt` - Raw experiment data
- `notes.md` - Detailed findings
- `README.md` - Analysis and interpretation

To update visualizations with new data:
1. Run experiments: `./run-experiment.sh`
2. Update data in `generate_charts.py`
3. Regenerate: `python3 generate_charts.py`
4. Refresh browser for interactive dashboard

## 🎨 Future Enhancements

Potential improvements:
- Add violin plots for distribution analysis
- Include error bars if multiple runs performed
- Add animation to show trends over time
- Create comparison with other refactoring tools
- Add heatmaps for file-level analysis
- Generate PDF report with all charts

---

For questions or issues with visualizations, see the main [README.md](./README.md) or check the [notes.md](./notes.md) for methodology details.
