import React from "react";
import { View } from "react-native";
import {
  Card,
  List,
  TextInput,
  Text,
  Button,
  Menu,
  Divider,
  Chip,
} from "react-native-paper";
import { useTheme } from "react-native-paper";
import type { AppTheme } from "../../styles/theme";
import { VoiceInputButton } from "../VoiceInputButton";
import metadataJson from "../../data/metadata.json";

interface BasicMetadataAccordionProps {
  expanded: boolean;
  onToggle: () => void;
  species: string | undefined;
  onSpeciesChange: (value: string | undefined) => void;
  site: string | undefined;
  onSiteChange: (value: string | undefined) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  speciesMenuVisible: boolean;
  onSpeciesMenuVisibilityChange: (visible: boolean) => void;
  siteMenuVisible: boolean;
  onSiteMenuVisibilityChange: (visible: boolean) => void;
  enableGPS: boolean;
  styles: any;
}

export const BasicMetadataAccordion: React.FC<BasicMetadataAccordionProps> = ({
  expanded,
  onToggle,
  species,
  onSpeciesChange,
  site,
  onSiteChange,
  notes,
  onNotesChange,
  speciesMenuVisible,
  onSpeciesMenuVisibilityChange,
  siteMenuVisible,
  onSiteMenuVisibilityChange,
  enableGPS,
  styles,
}) => {
  const theme = useTheme<AppTheme>();

  return (
    <Card style={styles.card}>
      <List.Accordion
        title="📝 Basic Metadata"
        titleStyle={{ fontSize: 18, fontWeight: "bold" }}
        style={styles.accordion}
        expanded={expanded}
        onPress={onToggle}
      >
        <Card.Content style={{ paddingTop: theme.spacing.md }}>
          {/* Species Dropdown */}
          <Menu
            visible={speciesMenuVisible}
            onDismiss={() => onSpeciesMenuVisibilityChange(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => onSpeciesMenuVisibilityChange(true)}
                style={styles.dropdownButton}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
              >
                {species || "Select Species"}
              </Button>
            }
          >
            {metadataJson.species.map((sp) => (
              <Menu.Item
                key={sp}
                onPress={() => {
                  onSpeciesChange(sp);
                  onSpeciesMenuVisibilityChange(false);
                }}
                title={sp}
              />
            ))}
            <Divider />
            <Menu.Item
              onPress={() => {
                onSpeciesChange(undefined);
                onSpeciesMenuVisibilityChange(false);
              }}
              title="Clear Selection"
            />
          </Menu>

          {/* Site Dropdown */}
          <Menu
            visible={siteMenuVisible}
            onDismiss={() => onSiteMenuVisibilityChange(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => onSiteMenuVisibilityChange(true)}
                style={styles.dropdownButton}
                contentStyle={styles.dropdownContent}
                icon="chevron-down"
              >
                {site || "Select Site"}
              </Button>
            }
          >
            {metadataJson.sites.map((s) => (
              <Menu.Item
                key={s}
                onPress={() => {
                  onSiteChange(s);
                  onSiteMenuVisibilityChange(false);
                }}
                title={s}
              />
            ))}
            <Divider />
            <Menu.Item
              onPress={() => {
                onSiteChange(undefined);
                onSiteMenuVisibilityChange(false);
              }}
              title="Clear Selection"
            />
          </Menu>

          {/* GPS Status */}
          {enableGPS && (
            <Chip icon="map-marker" style={styles.chip}>
              GPS Enabled (Location will be captured)
            </Chip>
          )}
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};
