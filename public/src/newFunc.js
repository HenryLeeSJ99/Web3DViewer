const file1 = {
    fileName: "Example.ifc",
    fileSize: "30mb"
};

const file2 = {
    fileName: "Example.ifc",
    fileSize: "30mb"
};

const file3 = {
    fileName: "Example.ifc",
    fileSize: "30mb"
};


const fileList = [];

fileList.push(file1);
fileList.push(file2);
fileList.push(file3);

fileList.forEach(element => {
    console.log(element.fileName + " " + element.fileSize);
});
