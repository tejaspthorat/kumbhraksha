enum ReportStatus {
  reported('reported'),
  escalated('escalated'),
  resolved('resolved');

  final String value;
  const ReportStatus(this.value);

  factory ReportStatus.fromString(String value) =>
      ReportStatus.values.firstWhere((e) => e.value == value,
          orElse: () => ReportStatus.reported);
}

enum AlertType {
  bleWitness('ble_witness'),
  gpsRadius('gps_radius');

  final String value;
  const AlertType(this.value);

  factory AlertType.fromString(String value) =>
      AlertType.values.firstWhere((e) => e.value == value,
          orElse: () => AlertType.gpsRadius);

  String get label => switch (this) {
        AlertType.bleWitness => 'Proximity Alert',
        AlertType.gpsRadius => 'Area Alert',
      };
}

enum PersonType {
  child('child'),
  adult('adult'),
  elderly('elderly');

  final String value;
  const PersonType(this.value);
}

const List<String> supportedLanguages = [
  'hindi',
  'english',
  'tamil',
  'telugu',
  'kannada',
  'marathi',
  'gujarati',
  'punjabi',
  'bengali',
  'odia',
  'maithili',
];

const Map<String, String> languageNames = {
  'hindi': 'हिन्दी',
  'english': 'English',
  'tamil': 'தமிழ்',
  'telugu': 'తెలుగు',
  'kannada': 'ಕನ್ನಡ',
  'marathi': 'मराठी',
  'gujarati': 'ગુજરાતી',
  'punjabi': 'ਪੰਜਾਬੀ',
  'bengali': 'বাংলা',
  'odia': 'ଓଡ଼ିଆ',
  'maithili': 'मैथिली',
};

// Clothing / report option lists used by selectors.
const List<String> clothingColors = [
  'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'White', 'Black', 'Brown', 'Pink', 'Purple', 'Grey',
];

const List<String> topTypes = ['T-shirt', 'Shirt', 'Kurta', 'Saree', 'Blouse', 'Sweater', 'Jacket'];
const List<String> bottomTypes = ['Pants', 'Jeans', 'Shorts', 'Dhoti', 'Saree', 'Skirt', 'Salwar'];
const List<String> footwearTypes = ['Slippers', 'Shoes', 'Sandals', 'Barefoot'];
const List<String> buildTypes = ['Thin', 'Average', 'Heavy', 'Muscular'];
const List<String> genders = ['M', 'F', 'Other'];
