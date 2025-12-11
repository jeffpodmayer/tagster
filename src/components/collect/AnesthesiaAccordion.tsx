import React from "react";
import { Card, List, TextInput } from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";

interface AnesthesiaAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  concentration: string;
  onConcentrationChange: (value: string) => void;
  waterTemp: string;
  onWaterTempChange: (value: string) => void;
  timing: string;
  onTimingChange: (value: string) => void;
  styles: any;
}

export const AnesthesiaAccordion: React.FC<AnesthesiaAccordionProps> = ({
  expanded,
  onToggle,
  concentration,
  onConcentrationChange,
  waterTemp,
  onWaterTempChange,
  timing,
  onTimingChange,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="💉 Anesthesia"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <Card.Content style={{ paddingTop: theme.spacing.md }}>
          {/* Concentration */}
          <TextInput
            label="Concentration"
            value={concentration}
            onChangeText={onConcentrationChange}
            mode="outlined"
            placeholder="Enter anesthesia concentration"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="water" />}
          />

          {/* Water Temperature */}
          <TextInput
            label="Water Temperature (°C)"
            value={waterTemp}
            onChangeText={onWaterTempChange}
            mode="outlined"
            placeholder="Enter water temperature"
            style={styles.input}
            keyboardType="decimal-pad"
            left={<TextInput.Icon icon="thermometer" />}
          />

          {/* Timing */}
          <TextInput
            label="Timing"
            value={timing}
            onChangeText={onTimingChange}
            mode="outlined"
            placeholder="Enter anesthesia timing (e.g., 5 min)"
            style={styles.input}
            left={<TextInput.Icon icon="clock-outline" />}
          />
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};
