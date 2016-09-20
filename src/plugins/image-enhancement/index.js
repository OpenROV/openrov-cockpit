function imageEnhancement(name, deps) {
    console.log("Node process for ImageEnhancement plugin.");
}

module.exports = function(name, deps) {
    return new imageEnhancement(name,deps);
};