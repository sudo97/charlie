# Charlie 🕵 ️ 

This is a tool for analyzing and visualizing your git history. Based on ideas from "Your Code as a Crime Scene" by Andrew M. Sutton.

This is the [Charlie](https://en.wikipedia.org/wiki/Charlie_Eppes) of your git history.

# TODO:
- [x] Calculate the complexity of each file based on the number of lines and the number of peaks
- [x] Retrieve number of revisions for each file
- [x] Calculate the hotspots based on the complexity and the number of revisions
- [x] Produce D3 visualization of the hotspots inside an html page
- [ ] Pick prettier colours for the visualization (and move them into theme.ts file)
- [x] Add a diagram (and calculation) for the coupling pairs
- [x] Add a diagram (and calculation) for the SOC
- [x] Add .charlie.config.json file support. It should support a list of files that should be excluded from the analysis, and a list of files that should be included, and a list of files that should be grouped into "architectural components".
- [ ] Coupled pairs and SOC should show only significant data. Currently this part is calculated in the frontend, but it should be calculated in the backend.
- [ ] Alternatively, maybe .charlie.config.json should be a starting point, but then in the webpage the user could change the config to see different slices of data.
- [ ] Add a way to group files into "architectural components"
- [ ] Add a way to find file/module owners
- [ ] Add a way to find teams that happen to form by analyzing authors
- [ ] Add a way to show fractal diagrams for the files or modules based on their ownership
- [ ] Add a way to show the "social graph" of the team based on the git history
- [ ] Add a way to calculate truck-factor of a project (i.e. how many people can leave before 50% of the code is left without a knowledgeable maintainer)