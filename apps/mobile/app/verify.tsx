import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ROLEX_MODELS,
  ROLEX_REFERENCE_PROFILES,
  bestProfileMatch,
  type ElementReading,
  type ElementSymbol,
  type MatchResult,
  type XRFMeasurement,
} from '@watch-auth/core';

const ELEMENTS: ElementSymbol[] = ['Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si', 'Au', 'Ag', 'Pt', 'Pd', 'Ru'];

const verdictLabel = {
  'likely-authentic': { text: 'Likely authentic', color: '#34d399' },
  'inconclusive': { text: 'Inconclusive', color: '#fbbf24' },
  'likely-fake': { text: 'Likely fake', color: '#f87171' },
} as const;

export default function VerifyScreen() {
  const [modelId, setModelId] = useState(ROLEX_MODELS[0]!.id);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [result, setResult] = useState<MatchResult | null>(null);

  const yearNum = parseInt(year, 10);
  const candidateProfiles = useMemo(
    () =>
      ROLEX_REFERENCE_PROFILES.filter(
        (p) => yearNum >= p.yearStart && (p.yearEnd == null || yearNum <= p.yearEnd),
      ),
    [yearNum],
  );

  const onAnalyze = () => {
    const elementReadings: ElementReading[] = Object.entries(readings)
      .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseFloat(raw) }))
      .filter((r) => Number.isFinite(r.pct) && r.pct > 0);
    if (elementReadings.length === 0) {
      setResult(null);
      return;
    }
    const measurement: XRFMeasurement = {
      id: `m-${Date.now()}`,
      partMeasured: 'case-back',
      measuredAt: new Date().toISOString(),
      instrument: 'niton-xl',
      readings: elementReadings,
    };
    setResult(bestProfileMatch(measurement, candidateProfiles));
  };

  const currentModel = ROLEX_MODELS.find((m) => m.id === modelId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Model</Text>
      <View style={styles.modelList}>
        {ROLEX_MODELS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setModelId(m.id)}
            style={[styles.modelChip, modelId === m.id && styles.modelChipActive]}
          >
            <Text style={[styles.modelChipText, modelId === m.id && styles.modelChipTextActive]}>
              {m.name} · {m.reference}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Year of manufacture</Text>
      <TextInput
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Measured XRF composition (%)</Text>
      <View style={styles.grid}>
        {ELEMENTS.map((el) => (
          <View key={el} style={styles.gridCell}>
            <Text style={styles.elemLabel}>{el}</Text>
            <TextInput
              value={readings[el] ?? ''}
              onChangeText={(v) => setReadings({ ...readings, [el]: v })}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#525252"
              style={styles.elemInput}
            />
          </View>
        ))}
      </View>

      <Pressable style={styles.button} onPress={onAnalyze}>
        <Text style={styles.buttonText}>Analyze</Text>
      </Pressable>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultSmall}>Verdict</Text>
          <Text style={[styles.resultVerdict, { color: verdictLabel[result.verdict].color }]}>
            {verdictLabel[result.verdict].text}
          </Text>
          <Text style={styles.resultScore}>{result.overallScore}/100</Text>
          <Text style={styles.resultSmall}>Profile: {result.materialName}</Text>
          {currentModel && (
            <Text style={styles.resultSmall}>{currentModel.name} ({currentModel.reference})</Text>
          )}
          {result.flags.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {result.flags.map((f, i) => (
                <Text key={i} style={styles.flag}>• {f}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, gap: 8 },
  label: { color: '#9ca3af', fontSize: 13, marginTop: 12, marginBottom: 4 },
  modelList: { gap: 6 },
  modelChip: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 10,
  },
  modelChipActive: { borderColor: '#d4af37', backgroundColor: '#1a1a1a' },
  modelChipText: { color: '#a3a3a3', fontSize: 13 },
  modelChipTextActive: { color: '#ededed' },
  input: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 10,
    color: '#ededed',
    fontSize: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: { width: '30%' },
  elemLabel: { color: '#737373', fontSize: 11, fontFamily: 'Courier' },
  elemInput: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    padding: 8,
    color: '#ededed',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#d4af37',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  resultCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  resultSmall: { color: '#9ca3af', fontSize: 12 },
  resultVerdict: { fontSize: 20, fontWeight: '700' },
  resultScore: { color: '#ededed', fontSize: 28, fontFamily: 'Courier', fontWeight: '700' },
  flag: { color: '#d1d5db', fontSize: 12, marginVertical: 2 },
});
