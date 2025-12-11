import React from "react";
import { View } from "react-native";
import { Card, List, TextInput } from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";
import { VoiceInputButton } from "../VoiceInputButton";

interface NotesAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  releaseNotes: string;
  onReleaseNotesChange: (value: string) => void;
  additionalNotes: string;
  onAdditionalNotesChange: (value: string) => void;
  styles: any;
}

export const NotesAccordion: React.FC<NotesAccordionProps> = ({
  expanded,
  onToggle,
  releaseNotes,
  onReleaseNotesChange,
  additionalNotes,
  onAdditionalNotesChange,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="📝 Notes"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <Card.Content style={{ paddingTop: theme.spacing.md }}>
          {/* Release Notes */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <TextInput
              label="Release Notes"
              value={releaseNotes}
              onChangeText={onReleaseNotesChange}
              mode="outlined"
              placeholder="Notes about fish release..."
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="fish" />}
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => {
                onReleaseNotesChange(
                  releaseNotes ? `${releaseNotes} ${text}` : text
                );
              }}
            />
          </View>

          {/* Additional Notes */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <TextInput
              label="Additional Notes"
              value={additionalNotes}
              onChangeText={onAdditionalNotesChange}
              mode="outlined"
              placeholder="Any additional observations..."
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="note-text" />}
            />
            <VoiceInputButton
              onTranscriptionComplete={(text) => {
                onAdditionalNotesChange(
                  additionalNotes ? `${additionalNotes} ${text}` : text
                );
              }}
            />
          </View>
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};
