import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AssessmentForm from './components/AssessmentForm';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AssessmentForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});