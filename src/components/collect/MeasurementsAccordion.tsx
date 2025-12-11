import React from "react";
import { View } from "react-native";
import { Card, List, TextInput, Text } from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";

interface MeasurementsAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  forkLength: string;
  onForkLengthChange: (value: string) => void;
  totalLength: string;
  onTotalLengthChange: (value: string) => void;
  bodyCircumference: string;
  onBodyCircumferenceChange: (value: string) => void;
  weight: string;
  onWeightChange: (value: string) => void;
  styles: any;
}

export const MeasurementsAccordion: React.FC<MeasurementsAccordionProps> = ({
  expanded,
  onToggle,
  forkLength,
  onForkLengthChange,
  totalLength,
  onTotalLengthChange,
  bodyCircumference,
  onBodyCircumferenceChange,
  weight,
  onWeightChange,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="📏 Measurements"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <Card.Content style={{ paddingTop: theme.spacing.md }}>
          {/* Fork Length */}
          <TextInput
            label="Fork Length (mm)"
            value={forkLength}
            onChangeText={onForkLengthChange}
            mode="outlined"
            placeholder="Enter fork length"
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Total Length */}
          <TextInput
            label="Total Length (mm)"
            value={totalLength}
            onChangeText={onTotalLengthChange}
            mode="outlined"
            placeholder="Enter total length"
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Body Circumference */}
          <TextInput
            label="Body Circumference (mm)"
            value={bodyCircumference}
            onChangeText={onBodyCircumferenceChange}
            mode="outlined"
            placeholder="Enter body circumference"
            style={styles.input}
            keyboardType="numeric"
          />

          {/* Weight */}
          <TextInput
            label="Weight (grams)"
            value={weight}
            onChangeText={onWeightChange}
            mode="outlined"
            placeholder="Enter weight"
            style={styles.input}
            keyboardType="numeric"
          />
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};
