# Charlie 🕵 ️ 

This is a tool for analyzing and visualizing your git history. Based on ideas from "Your Code as a Crime Scene" by Andrew M. Sutton.

This is the [Charlie](https://en.wikipedia.org/wiki/Charlie_Eppes) of your git history.

# TODO:
- [x] Calculate the complexity of each file based on the number of lines and the number of peaks
- [x] Retrieve number of revisions for each file
- [x] Calculate the hotspots based on the complexity and the number of revisions
- [x] Produce D3 visualization of the hotspots inside an html page
- [ ] Pick prettier colours for the visualization
- [ ] Add a diagram (and calculation) for the coupling pairs
- [ ] Add a diagram (and calculation) for the SOC
- [ ] Add .charlignore file support
- [ ] Add a way to provide "include" and "exclude" patterns for the git log, so that subtrees can be analyzed separately
- [ ] Add a way to group files into "architectural components"
- [ ] Add a way to find file/module owners
- [ ] Add a way to find teams that happen to form by analyzing authors
- [ ] Add a way to show fractal diagrams for the files or modules based on their ownership