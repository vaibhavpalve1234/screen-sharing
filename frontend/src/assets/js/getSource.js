const { getInputSources, selectSource } = require("./video");


async function getSource(Menu, mainWindow) {
    const availableSources = getInputSources();
    availableSources.then((sources) => {
        let videoOptionsMenu = Menu.buildFromTemplate(
            sources.map((source) => {
                return {
                    label: source.name,
                    click: () => selectSource(source, mainWindow),// here error pass which window you want error not fix
                };
            })
        );
        videoOptionsMenu.popup();
    });

}

module.exports = getSource