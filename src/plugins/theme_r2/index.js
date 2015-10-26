function theme_r2(name, deps) {
  console.log('This is where theme_r2 plugin code would execute in the node process.');

  this.plugin={
    name: "theme_r2",
    type: "theme"
  };
}

theme_r2.prototype.getSettingSchema = function getSettingSchema(){
  return [{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "id": "/",
    "type": "object",
    "properties": {
      "ui-layout": {
        "id": "ui-layout",
        "type": "array",
        "items": {
          "id": "0",
          "type": "object",
          "properties": {
            "section": {
              "id": "section",
              "type": "string"
            },
            "widgets": {
              "id": "widgets",
              "type": "array",
              "items": {
                "id": "0",
                "type": "object",
                "properties": {
                  "tag": {
                    "id": "tag",
                    "type": "string"
                  },
                  "settings": {
                    "id": "settings",
                    "type": "object",
                    "properties": {}
                  },
                  "_linkhref": {
                    "id": "_linkhref",
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    }
  }]
}

module.exports = function (name, deps) {
  return new theme_r2(name,deps);
};
