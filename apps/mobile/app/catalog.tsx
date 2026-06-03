import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ROLEX_BRAND,
  ROLEX_MATERIALS,
  ROLEX_MODELS,
  ROLEX_REFERENCE_PROFILES,
} from '@watch-auth/core';

export default function CatalogScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{ROLEX_BRAND.name}</Text>
      <Text style={styles.subtitle}>
        {ROLEX_MODELS.length} models · {ROLEX_MATERIALS.length} materials ·{' '}
        {ROLEX_REFERENCE_PROFILES.length} profiles
      </Text>

      <Text style={styles.section}>Models</Text>
      {ROLEX_MODELS.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.cardTitle}>{m.name}</Text>
          <Text style={styles.cardMeta}>
            Ref. {m.reference} · {m.yearStart}–{m.yearEnd ?? 'present'} · {m.caliber}
          </Text>
        </View>
      ))}

      <Text style={styles.section}>Materials</Text>
      {ROLEX_MATERIALS.map((mat) => {
        const profile = ROLEX_REFERENCE_PROFILES.find((p) => p.materialId === mat.id);
        return (
          <View key={mat.id} style={styles.card}>
            <Text style={styles.cardTitle}>{mat.name}</Text>
            <Text style={styles.cardMeta}>{mat.kind.toUpperCase()}</Text>
            {mat.description && <Text style={styles.cardBody}>{mat.description}</Text>}
            {profile && (
              <View style={styles.elementList}>
                {profile.elements.map((e) => (
                  <Text key={e.element} style={styles.elementRow}>
                    {e.element}: {e.minPct}–{e.maxPct}%{e.isCritical ? ' ★' : ''}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  h1: { color: '#ededed', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 16 },
  section: { color: '#ededed', fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { color: '#ededed', fontWeight: '600', fontSize: 15 },
  cardMeta: { color: '#737373', fontSize: 12, marginTop: 2 },
  cardBody: { color: '#a3a3a3', fontSize: 12, marginTop: 6 },
  elementList: { marginTop: 8, gap: 2 },
  elementRow: { color: '#d1d5db', fontSize: 12, fontFamily: 'Courier' },
});
