import { View, Text, StyleSheet } from 'react-native'

export default function TimeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tidrapportering</Text>
      <Text style={styles.subtitle}>Tidlogg -- kommer snart</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
})
