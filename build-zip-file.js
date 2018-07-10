const Zip = require("adm-zip");
const zip = new Zip();
zip.addLocalFolder("dist/");
zip.writeZip("table-genie.zip");
