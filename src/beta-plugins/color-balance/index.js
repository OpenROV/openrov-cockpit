function colorBalance(name, deps) {
    console.log("Node process for Color Balance plugin.");
}

module.exports = function(name, deps) {
    return new colorBalance(name,deps);
};