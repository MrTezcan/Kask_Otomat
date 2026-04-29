const fs = require('fs');
let appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
appJson.expo.orientation = 'landscape';
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2), 'utf8');

let appTsx = fs.readFileSync('App.tsx', 'utf8');

// Replace all <View style={styles.centerSection}> with <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }}>
appTsx = appTsx.replace(
  /<View style=\{styles\.centerSection\}>/g,
  "<ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }}>"
);

// We need to find the matching closing </View> for those centerSections.
// Actually, an easier way is to just wrap the children of centerSection inside a ScrollView.
// Wait, replacing <View with <ScrollView requires replacing </View> with </ScrollView>.
// Since I know my code structure perfectly:
// I will just do a regex replace to catch the closing tags correctly, or I can just use write_to_file again!
