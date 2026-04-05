import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Hem' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projekt' }} />
      <Tabs.Screen name="time" options={{ title: 'Tid' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  )
}
