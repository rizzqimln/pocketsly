import 'package:flutter_test/flutter_test.dart';
import 'package:pocketsly_mobile/main.dart';

void main() {
  testWidgets('App renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const PocketslyApp());
    expect(find.text('Pocketsly'), findsWidgets);
  });
}
