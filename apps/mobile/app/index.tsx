import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        Authentication <Text style={styles.titleAccent}>by composition</Text>
      </Text>
      <Text style={styles.subtitle}>
        Compare metal composition measured with the Niton XL against a reference database
        by brand, model, and year.
      </Text>

      <Link href="/verify" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>Verify a watch</Text>
          <Text style={styles.cardBody}>
            Enter brand, model, year, and the measured XRF composition.
          </Text>
        </Pressable>
      </Link>

      <Link href="/catalog" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>Catalog</Text>
          <Text style={styles.cardBody}>
            Browse models, materials, and reference profiles.
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, gap: 16 },
  title: { color: '#ededed', fontSize: 28, fontWeight: '700' },
  titleAccent: { color: '#d4af37' },
  subtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { color: '#ededed', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  cardBody: { color: '#9ca3af', fontSize: 13 },
});
