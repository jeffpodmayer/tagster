import React from "react";
import { View } from "react-native";
import { Card, List, TextInput, Text, Switch } from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";

interface SamplesAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  geneticClipEnabled: boolean;
  onGeneticClipEnabledChange: (value: boolean) => void;
  geneticClipId: string;
  onGeneticClipIdChange: (value: string) => void;
  isotopeClipEnabled: boolean;
  onIsotopeClipEnabledChange: (value: boolean) => void;
  isotopeClipId: string;
  onIsotopeClipIdChange: (value: string) => void;
  styles: any;
}

export const SamplesAccordion: React.FC<SamplesAccordionProps> = ({
  expanded,
  onToggle,
  geneticClipEnabled,
  onGeneticClipEnabledChange,
  geneticClipId,
  onGeneticClipIdChange,
  isotopeClipEnabled,
  onIsotopeClipEnabledChange,
  isotopeClipId,
  onIsotopeClipIdChange,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="🧪 Samples"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <Card.Content style={{ paddingTop: theme.spacing.md }}>
          {/* Genetic Clip Section */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text variant="titleMedium" style={{ flex: 1 }}>
                Genetic Clip
              </Text>
              <Switch
                value={geneticClipEnabled}
                onValueChange={onGeneticClipEnabledChange}
              />
            </View>

            {geneticClipEnabled && (
              <TextInput
                label="Genetic Clip ID (G prefix)"
                value={geneticClipId}
                onChangeText={(text) => {
                  // Auto-add 'G' prefix if not present
                  const trimmed = text.trim();
                  if (trimmed && !trimmed.toUpperCase().startsWith("G")) {
                    onGeneticClipIdChange(`G${trimmed}`);
                  } else {
                    onGeneticClipIdChange(trimmed);
                  }
                }}
                mode="outlined"
                placeholder="G12345"
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                left={<TextInput.Icon icon="dna" />}
              />
            )}
          </View>

          {/* Isotope Clip Section */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text variant="titleMedium" style={{ flex: 1 }}>
                Stable Isotopes Clip
              </Text>
              <Switch
                value={isotopeClipEnabled}
                onValueChange={onIsotopeClipEnabledChange}
              />
            </View>

            {isotopeClipEnabled && (
              <TextInput
                label="Isotope Clip ID (I prefix)"
                value={isotopeClipId}
                onChangeText={(text) => {
                  // Auto-add 'I' prefix if not present
                  const trimmed = text.trim();
                  if (trimmed && !trimmed.toUpperCase().startsWith("I")) {
                    onIsotopeClipIdChange(`I${trimmed}`);
                  } else {
                    onIsotopeClipIdChange(trimmed);
                  }
                }}
                mode="outlined"
                placeholder="I12345"
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                left={<TextInput.Icon icon="flask" />}
              />
            )}
          </View>
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};
