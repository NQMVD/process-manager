- [x] fix the dropdown for the clean button not showing
- [ ] fix the hover colors for the card buttons
- [ ] fix timer not updating
- [x] remove individual tasks using the `pueue remove <ID>` command via a button in the task card, task has to be completed, killed, or failed for that
- [ ] make this run without having to run in `next dev`, because building and starting doesn't work for some reason
  - [ ] first attempt didnt really work
- [ ] fix colors and themes, light mode is broken
- [x] killed or failed tasks should be restartable
- [x] new approach: have two termination buttons for tasks, one for shutdown and one for kill. look at the guide for how to do this
- [ ] new button redesign, check images, svgs and the json save file from the design i made using tldraw
  - [ ] the task id should be displayed in font of the task name with a hashtag and the id, both in a dimmed color
- [ ] new icons, use nucleo icons
  - note: the svg icons in the tldraw save file are base64 encoded, we want the actual svg files tho, they will be in a seperate folder
- [ ] maybe add command panel like in ides like vscode or zed, opening on cmd+k to open a modal/form to spawn a new task

- [ ] make the custom command creation work
- [ ] also add the services from the server to the drawer
  - warp
  - docs
  - lcs
  - dufs
  - soft serve
  - zellij webview
  - sshx
- [ ] support for groups
  - [ ] show group per task
  - [ ] filter by group with tabs

### future

- [ ] hide it behind some kind of auth
  - [ ] maybe a simple password prompt?
