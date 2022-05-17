# SchoLExtension

Various quality of life upgrades for SchoL (SMGS SchoolBox)

This also serves as a chrome extension for testing purposes

```bash
git clone https://github.com/smgs-projects/SchoLExtension
```

## Installing on SchoolBox

- Visit the admin panel and search for "Custom Javascript"
- Ensure all the settings near the top of the file (variables in all CAPS) are set correctly
- Paste the contents of <code>compiled.js</code> into the textarea surrounded by a <code>\<script></code> tag


## Installing the server

- Install NodeJS 16.13.x or greater
- Clone the extension with git
- Open terminal and go to the <code>backend</code> folder
- Install the relevant npm libraries and start the server
    - It is recommended you use a process manager such as PM2 to ensure it continuously runs
```bash
npm i
node index.js
```

## Testing

- Clone the extension with GIT
- On a chromium based browser, open the "Extensions" page ([chrome://extensions/](chrome://extensions/)) and turn on the "Developer mode"
- Click on the "Load unpacked" button and select the folder extracted from the zip archive
![Developer mode](https://i.ibb.co/Sv0KKst/Chrome-Extensions.png)
- Select the extension folder when asked, the extension will then be installed
- Enable the extension through the extension's icon in the top bar of chrome
