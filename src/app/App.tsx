import { Checkbox } from "@base-ui/react/checkbox";
import { Tabs } from "@base-ui/react/tabs";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { css, Global } from "@emotion/react";
import styled from "@emotion/styled";
import { useStore } from "@nanostores/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { EncodingComparison } from "../domain/encoding/encodingLab";
import type {
  EncodingMode,
  ParserMode,
  SearchRow,
  SearchSettings,
  SortMode,
  UrlParts,
  ValueKind,
} from "../domain/url/types";
import {
  $encodingComparison,
  $encodingSample,
  $parsedUrl,
  $parserPreview,
  $previewUrl,
  $rows,
  $serializedSearch,
  $settings,
  $urlInput,
  $warnings,
  addRow,
  copyRow,
  currentShareUrl,
  moveRowByStep,
  removeRow,
  reorderRow,
  setEncodingMode,
  setEncodingSample,
  setQsSetting,
  setQueryStringSetting,
  setRow,
  setSearchSettings,
  setUrlInput,
  setUrlPart,
  toggleRow,
} from "./state";

const parserOptions: { value: ParserMode; label: string }[] = [
  { value: "qs", label: "qs" },
  { value: "query-string", label: "query-string" },
  { value: "native", label: "URLSearchParams" },
];

const valueKindOptions: { value: ValueKind; label: string }[] = [
  { value: "value", label: "key=value" },
  { value: "empty", label: "key=" },
  { value: "bare", label: "key" },
];

const arrayStyleOptions: { value: SearchSettings["arrayStyle"]; label: string }[] = [
  { value: "repeat", label: "repeat" },
  { value: "indices", label: "indices" },
  { value: "brackets", label: "brackets" },
  { value: "comma", label: "comma" },
  { value: "none", label: "none" },
  { value: "bracket", label: "bracket" },
  { value: "index", label: "index" },
  { value: "separator", label: "separator" },
  { value: "bracket-separator", label: "bracket-separator" },
  { value: "colon-list-separator", label: "colon-list-separator" },
];

const encodingOptions: { value: EncodingMode; label: string }[] = [
  { value: "rfc3986", label: "RFC 3986" },
  { value: "rfc1738", label: "RFC 1738" },
  { value: "form", label: "Form +" },
  { value: "native", label: "Native" },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "preserveRows", label: "Row order" },
  { value: "libraryDefault", label: "Library default" },
  { value: "alpha", label: "A to Z" },
];

const qsDuplicateOptions: {
  value: SearchSettings["advanced"]["qs"]["duplicates"];
  label: string;
}[] = [
  { value: "combine", label: "combine" },
  { value: "first", label: "first" },
  { value: "last", label: "last" },
];

const charsetOptions: { value: SearchSettings["advanced"]["qs"]["charset"]; label: string }[] = [
  { value: "utf-8", label: "utf-8" },
  { value: "iso-8859-1", label: "iso-8859-1" },
];

function App() {
  const urlInput = useStore($urlInput);
  const parsed = useStore($parsedUrl);
  const rows = useStore($rows);
  const settings = useStore($settings);
  const serializedSearch = useStore($serializedSearch);
  const previewUrl = useStore($previewUrl);
  const warnings = useStore($warnings);
  const parserPreview = useStore($parserPreview);
  const encodingSample = useStore($encodingSample);
  const encodingComparison = useStore($encodingComparison);
  const [shareState, setShareState] = useState("Ready");

  async function copyShareLink() {
    const shareUrl = currentShareUrl();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareState("Copied");
        window.setTimeout(() => setShareState("Ready"), 2000);
        return;
      } catch {
        setShareState("Copy failed");
      }
    }
    setShareState(shareUrl);
  }

  return (
    <>
      <Global styles={globalStyles} />
      <Shell>
        <Header>
          <TitleBlock>
            <BrandRow>
              <LogoBadge>
                <LogoMark aria-hidden="true" viewBox="0 0 100 100" width="30" height="30">
                  <g fill="currentColor">
                    <circle cx="36" cy="18" r="4.5" />
                    <circle cx="64" cy="18" r="4.5" />
                    <rect
                      x="40"
                      y="33"
                      width="20"
                      height="5"
                      rx="2.5"
                      transform="rotate(-12, 50, 35.5)"
                    />
                    <path
                      d="M 40 56 A 10 10 0 0 1 60 56 A 10 10 0 0 1 50 64"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                    <circle cx="50" cy="73" r="3" />
                  </g>
                  <path
                    d="M 57 93 L 45 83 C 42 80, 42 78, 46 78 C 50 78, 52 80, 50 82 C 48 84, 44 86, 44 89 C 44 92, 48 94, 52 92 L 58 87"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                </LogoMark>
              </LogoBadge>
              <BrandCopy>
                <Eyebrow>Developer utility</Eyebrow>
                <h1>URL Workbench</h1>
              </BrandCopy>
            </BrandRow>
            <p>
              Inspect URL anatomy, edit query parameters, compare parser output, test encoding, and
              share reproducible URL states.
            </p>
          </TitleBlock>
          <HeaderActions>
            <Pill aria-label={`Current parser: ${settings.mode}`}>Parser: {settings.mode}</Pill>
            <Button type="button" onClick={copyShareLink}>
              Copy share link
            </Button>
          </HeaderActions>
        </Header>

        <UrlBarPanel aria-label="Total URL">
          <FieldLabel htmlFor="total-url">Total URL</FieldLabel>
          <UrlInput
            id="total-url"
            value={urlInput}
            spellCheck={false}
            onChange={(event) => setUrlInput(event.target.value)}
          />
          <MetaRow>
            <span>{parsed.ok ? "valid URL" : parsed.error}</span>
            <span>{shareState}</span>
          </MetaRow>
        </UrlBarPanel>

        <MainGrid>
          <PrimaryColumn>
            <WorkspacePanel>
              <PanelHeader>
                <div>
                  <SectionKicker>Node URL parts</SectionKicker>
                  <h2>Anatomy</h2>
                </div>
              </PanelHeader>
              {parsed.ok ? (
                <AnatomyPanel parts={parsed.parts} />
              ) : (
                <EmptyState>Invalid URL</EmptyState>
              )}
            </WorkspacePanel>

            <WorkspacePanel>
              <PanelHeader>
                <div>
                  <SectionKicker>Ordered rows</SectionKicker>
                  <h2>Search Parameters</h2>
                </div>
                <Button type="button" onClick={addRow}>
                  Add parameter
                </Button>
              </PanelHeader>
              <SearchRows rows={rows} />
            </WorkspacePanel>
          </PrimaryColumn>

          <SecondaryColumn>
            <SettingsPanel settings={settings} />
            <OutputPanel
              serializedSearch={serializedSearch}
              previewUrl={previewUrl}
              parserPreview={parserPreview}
              encodingSample={encodingSample}
              encodingComparison={encodingComparison}
              warnings={warnings}
              onEncodingSampleChange={setEncodingSample}
            />
          </SecondaryColumn>
        </MainGrid>

        <Footer>
          <span>MIT License, VdustR (ViPro) 2026</span>
          <FooterLink href="https://github.com/vdustr/url-workbench">
            github.com/vdustr/url-workbench
          </FooterLink>
        </Footer>
      </Shell>
    </>
  );
}

function AnatomyPanel({ parts }: { parts: UrlParts }) {
  return (
    <AnatomyGrid>
      <TextField
        label="protocol"
        value={parts.protocol}
        onChange={(value) => setUrlPart("protocol", value)}
      />
      <TextField
        label="domain / hostname"
        value={parts.hostname}
        onChange={(value) => setUrlPart("hostname", value)}
      />
      <TextField label="port" value={parts.port} onChange={(value) => setUrlPart("port", value)} />
      <TextField
        label="path"
        value={parts.pathname}
        onChange={(value) => setUrlPart("pathname", value)}
      />
      <TextField
        label="search"
        value={parts.search}
        onChange={(value) => setUrlPart("search", value)}
      />
      <TextField label="hash" value={parts.hash} onChange={(value) => setUrlPart("hash", value)} />
      <TextField
        label="username"
        value={parts.username}
        onChange={(value) => setUrlPart("username", value)}
      />
      <TextField
        label="password"
        value={parts.password}
        onChange={(value) => setUrlPart("password", value)}
      />
      <Readout label="host" value={parts.host} />
      <Readout label="origin" value={parts.origin} />
    </AnatomyGrid>
  );
}

function SearchRows({ rows }: { rows: SearchRow[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderRow(String(active.id), String(over.id));
  }

  if (rows.length === 0) {
    return (
      <EmptyState>
        <Button type="button" onClick={addRow}>
          Add first parameter
        </Button>
      </EmptyState>
    );
  }

  return (
    <RowsArea>
      <RowsHeader aria-hidden>
        <span>sort</span>
        <span>on</span>
        <span>key</span>
        <span>value</span>
        <span>shape</span>
        <span>actions</span>
      </RowsHeader>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <RowsList>
            {rows.map((row, index) => (
              <SortableSearchRow key={row.id} row={row} index={index} count={rows.length} />
            ))}
          </RowsList>
        </SortableContext>
      </DndContext>
    </RowsArea>
  );
}

function SortableSearchRow({
  row,
  index,
  count,
}: {
  row: SearchRow;
  index: number;
  count: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <RowItem ref={setNodeRef} style={style} data-dragging={isDragging || undefined}>
      <DragHandle
        type="button"
        aria-label={`Sort ${row.key || "parameter"}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </DragHandle>
      <Toggle
        label={row.enabled ? "enabled" : "disabled"}
        checked={row.enabled}
        onChange={(checked) => toggleRow(row.id, checked)}
      />
      <InlineInput
        aria-label="parameter key"
        value={row.key}
        spellCheck={false}
        onChange={(event) => setRow(row.id, { key: event.target.value })}
      />
      <InlineInput
        aria-label="parameter value"
        value={row.value}
        spellCheck={false}
        disabled={row.valueKind === "bare"}
        onChange={(event) => setRow(row.id, { value: event.target.value })}
      />
      <InlineSelect
        aria-label="parameter shape"
        value={row.valueKind}
        onChange={(event) => setRow(row.id, { valueKind: event.target.value as ValueKind })}
      >
        {valueKindOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </InlineSelect>
      <RowActions>
        <IconButton
          type="button"
          aria-label="Move up"
          disabled={index === 0}
          title="Move up"
          onClick={() => moveRowByStep(row.id, -1)}
        >
          ↑
        </IconButton>
        <IconButton
          type="button"
          aria-label="Move down"
          disabled={index === count - 1}
          title="Move down"
          onClick={() => moveRowByStep(row.id, 1)}
        >
          ↓
        </IconButton>
        <IconButton
          type="button"
          aria-label="Duplicate"
          title="Duplicate"
          onClick={() => copyRow(row.id)}
        >
          ⧉
        </IconButton>
        <DangerButton
          type="button"
          aria-label="Remove"
          title="Remove"
          onClick={() => removeRow(row.id)}
        >
          ×
        </DangerButton>
      </RowActions>
    </RowItem>
  );
}

function SettingsPanel({ settings }: { settings: SearchSettings }) {
  const qsSettings = settings.advanced.qs;
  const queryStringSettings = settings.advanced.queryString;

  return (
    <WorkspacePanel>
      <PanelHeader>
        <div>
          <SectionKicker>Serialization</SectionKicker>
          <h2>Parser Settings</h2>
        </div>
      </PanelHeader>

      <ModeGrid role="group" aria-label="parser mode">
        {parserOptions.map((option) => (
          <SegmentButton
            key={option.value}
            type="button"
            aria-pressed={settings.mode === option.value}
            data-active={settings.mode === option.value || undefined}
            onClick={() => setSearchSettings({ mode: option.value })}
          >
            {option.label}
          </SegmentButton>
        ))}
      </ModeGrid>

      <SettingsGrid>
        <SelectField
          label="array format"
          value={settings.arrayStyle}
          options={arrayStyleOptions}
          onChange={(value) => setSearchSettings({ arrayStyle: value })}
        />
        <TextField
          label="separator"
          value={settings.arrayFormatSeparator}
          onChange={(value) => setSearchSettings({ arrayFormatSeparator: value || "|" })}
        />
        <SelectField
          label="url encode"
          value={settings.encoding}
          options={encodingOptions}
          onChange={setEncodingMode}
        />
        <SelectField
          label="sort"
          value={settings.sort}
          options={sortOptions}
          onChange={(value) => setSearchSettings({ sort: value })}
        />
      </SettingsGrid>

      <Tabs.Root defaultValue="qs">
        <TabList>
          <Tabs.Tab value="qs">qs</Tabs.Tab>
          <Tabs.Tab value="query-string">query-string</Tabs.Tab>
        </TabList>
        <Tabs.Panel value="qs">
          <SettingsGrid>
            <BooleanSetting
              label="encode"
              checked={qsSettings.encode}
              onChange={(value) => setQsSetting("encode", value)}
            />
            <BooleanSetting
              label="encode values only"
              checked={qsSettings.encodeValuesOnly}
              onChange={(value) => setQsSetting("encodeValuesOnly", value)}
            />
            <BooleanSetting
              label="allow dots"
              checked={qsSettings.allowDots}
              onChange={(value) => setQsSetting("allowDots", value)}
            />
            <BooleanSetting
              label="encode dot keys"
              checked={qsSettings.encodeDotInKeys}
              onChange={(value) => setQsSetting("encodeDotInKeys", value)}
            />
            <BooleanSetting
              label="decode dot keys"
              checked={qsSettings.decodeDotInKeys}
              onChange={(value) => setQsSetting("decodeDotInKeys", value)}
            />
            <BooleanSetting
              label="strict nulls"
              checked={qsSettings.strictNullHandling}
              onChange={(value) => setQsSetting("strictNullHandling", value)}
            />
            <BooleanSetting
              label="skip nulls"
              checked={qsSettings.skipNulls}
              onChange={(value) => setQsSetting("skipNulls", value)}
            />
            <BooleanSetting
              label="comma round trip"
              checked={qsSettings.commaRoundTrip}
              onChange={(value) => setQsSetting("commaRoundTrip", value)}
            />
            <SelectField
              label="duplicates"
              value={qsSettings.duplicates}
              options={qsDuplicateOptions}
              onChange={(value) => setQsSetting("duplicates", value)}
            />
            <SelectField
              label="charset"
              value={qsSettings.charset}
              options={charsetOptions}
              onChange={(value) => setQsSetting("charset", value)}
            />
            <BooleanSetting
              label="charset sentinel"
              checked={qsSettings.charsetSentinel}
              onChange={(value) => setQsSetting("charsetSentinel", value)}
            />
            <BooleanSetting
              label="numeric entities"
              checked={qsSettings.interpretNumericEntities}
              onChange={(value) => setQsSetting("interpretNumericEntities", value)}
            />
            <NumberField
              label="depth"
              value={qsSettings.depth}
              min={0}
              onChange={(value) => setQsSetting("depth", value)}
            />
            <BooleanSetting
              label="strict depth"
              checked={qsSettings.strictDepth}
              onChange={(value) => setQsSetting("strictDepth", value)}
            />
            <NumberField
              label="parameter limit"
              value={qsSettings.parameterLimit}
              min={0}
              onChange={(value) => setQsSetting("parameterLimit", value)}
            />
            <NumberField
              label="array limit"
              value={qsSettings.arrayLimit}
              min={0}
              onChange={(value) => setQsSetting("arrayLimit", value)}
            />
            <BooleanSetting
              label="throw on limit"
              checked={qsSettings.throwOnLimitExceeded}
              onChange={(value) => setQsSetting("throwOnLimitExceeded", value)}
            />
            <BooleanSetting
              label="parse arrays"
              checked={qsSettings.parseArrays}
              onChange={(value) => setQsSetting("parseArrays", value)}
            />
            <BooleanSetting
              label="allow sparse"
              checked={qsSettings.allowSparse}
              onChange={(value) => setQsSetting("allowSparse", value)}
            />
          </SettingsGrid>
        </Tabs.Panel>
        <Tabs.Panel value="query-string">
          <SettingsGrid>
            <BooleanSetting
              label="encode"
              checked={queryStringSettings.encode}
              onChange={(value) => setQueryStringSetting("encode", value)}
            />
            <BooleanSetting
              label="decode"
              checked={queryStringSettings.decode}
              onChange={(value) => setQueryStringSetting("decode", value)}
            />
            <BooleanSetting
              label="strict"
              checked={queryStringSettings.strict}
              onChange={(value) => setQueryStringSetting("strict", value)}
            />
            <BooleanSetting
              label="skip null"
              checked={queryStringSettings.skipNull}
              onChange={(value) => setQueryStringSetting("skipNull", value)}
            />
            <BooleanSetting
              label="skip empty string"
              checked={queryStringSettings.skipEmptyString}
              onChange={(value) => setQueryStringSetting("skipEmptyString", value)}
            />
            <BooleanSetting
              label="parse numbers"
              checked={queryStringSettings.parseNumbers}
              onChange={(value) => setQueryStringSetting("parseNumbers", value)}
            />
            <BooleanSetting
              label="parse booleans"
              checked={queryStringSettings.parseBooleans}
              onChange={(value) => setQueryStringSetting("parseBooleans", value)}
            />
            <BooleanSetting
              label="parse fragment"
              checked={queryStringSettings.parseFragmentIdentifier}
              onChange={(value) => setQueryStringSetting("parseFragmentIdentifier", value)}
            />
          </SettingsGrid>
        </Tabs.Panel>
      </Tabs.Root>
    </WorkspacePanel>
  );
}

function OutputPanel({
  serializedSearch,
  previewUrl,
  parserPreview,
  encodingSample,
  encodingComparison,
  warnings,
  onEncodingSampleChange,
}: {
  serializedSearch: string;
  previewUrl: string;
  parserPreview: { serialized: string; parsed: unknown };
  encodingSample: string;
  encodingComparison: EncodingComparison;
  warnings: { id: string; severity: "info" | "warning" | "danger"; message: string }[];
  onEncodingSampleChange: (value: string) => void;
}) {
  return (
    <WorkspacePanel>
      <PanelHeader>
        <div>
          <SectionKicker>Preview</SectionKicker>
          <h2>Output</h2>
        </div>
      </PanelHeader>

      <Tabs.Root defaultValue="url">
        <TabList>
          <Tabs.Tab value="url">URL</Tabs.Tab>
          <Tabs.Tab value="parsed">Parsed</Tabs.Tab>
          <Tabs.Tab value="encoding">Encoding</Tabs.Tab>
          <Tabs.Tab value="code">Code</Tabs.Tab>
        </TabList>
        <Tabs.Panel value="url">
          <OutputStack>
            <Readout label="preview URL" value={previewUrl} wide />
            <Readout
              label="search"
              value={serializedSearch ? `?${serializedSearch}` : "(empty)"}
              wide
            />
            <Warnings warnings={warnings} />
          </OutputStack>
        </Tabs.Panel>
        <Tabs.Panel value="parsed">
          <CodeBlock>{toJson(parserPreview.parsed)}</CodeBlock>
        </Tabs.Panel>
        <Tabs.Panel value="encoding">
          <OutputStack>
            <TextField label="sample" value={encodingSample} onChange={onEncodingSampleChange} />
            <Readout label="encodeURI" value={encodingComparison.encodeURI} wide />
            <Readout
              label="encodeURIComponent"
              value={encodingComparison.encodeURIComponent}
              wide
            />
            <Readout label="strict RFC 3986" value={encodingComparison.strictRfc3986} wide />
            <Readout label="form encode" value={encodingComparison.form} wide />
          </OutputStack>
        </Tabs.Panel>
        <Tabs.Panel value="code">
          <CodeBlock>{`const url = new URL(${JSON.stringify(previewUrl)});
const params = url.searchParams;
const query = ${JSON.stringify(serializedSearch)};`}</CodeBlock>
        </Tabs.Panel>
      </Tabs.Root>
    </WorkspacePanel>
  );
}

function Warnings({
  warnings,
}: {
  warnings: { id: string; severity: "info" | "warning" | "danger"; message: string }[];
}) {
  if (warnings.length === 0) {
    return <Notice data-severity="info">No warnings</Notice>;
  }

  return (
    <WarningList>
      {warnings.map((warning) => (
        <Notice key={warning.id} data-severity={warning.severity}>
          {warning.message}
        </Notice>
      ))}
    </WarningList>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TextInput
        id={id}
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldGroup>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  const id = `number-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TextInput
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FieldGroup>
  );
}

function SelectField<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
}) {
  const id = `select-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TextSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextSelect>
    </FieldGroup>
  );
}

function BooleanSetting({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <BooleanRow>
      <span>{label}</span>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </BooleanRow>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <ToggleRoot aria-label={label} checked={checked} onCheckedChange={onChange}>
      <ToggleIndicator keepMounted />
    </ToggleRoot>
  );
}

function Readout({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <ReadoutBox data-wide={wide || undefined}>
      <ReadoutLabel>{label}</ReadoutLabel>
      <ReadoutValue title={value}>{value}</ReadoutValue>
    </ReadoutBox>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <EmptyBox>{children}</EmptyBox>;
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

const globalStyles = css`
  :root {
    --canvas: oklch(0.972 0.007 235);
    --panel: oklch(0.996 0.003 185);
    --panel-strong: oklch(0.99 0.005 205);
    --field: oklch(0.998 0.002 190);
    --field-disabled: oklch(0.955 0.007 225);
    --ink: oklch(0.2 0.033 255);
    --ink-hover: oklch(0.29 0.035 255);
    --inverse-ink: oklch(0.986 0.004 190);
    --muted: oklch(0.45 0.033 245);
    --subtle: oklch(0.59 0.027 245);
    --line: oklch(0.885 0.016 235);
    --line-strong: oklch(0.78 0.027 235);
    --control: oklch(0.94 0.012 225);
    --control-hover: oklch(0.9 0.018 225);
    --accent: oklch(0.5 0.098 185);
    --accent-strong: oklch(0.39 0.085 185);
    --accent-soft: oklch(0.935 0.045 185);
    --blue: oklch(0.49 0.15 260);
    --blue-soft: oklch(0.93 0.032 260);
    --focus-ring: oklch(0.83 0.085 205);
    --amber: oklch(0.51 0.12 70);
    --amber-soft: oklch(0.94 0.045 85);
    --red: oklch(0.48 0.16 30);
    --red-soft: oklch(0.93 0.052 28);
    --shadow: 0 1px 2px oklch(0.2 0.033 255 / 0.08), 0 12px 30px oklch(0.2 0.033 255 / 0.08);
    --mono: "SFMono-Regular", "Cascadia Code", "Roboto Mono", Consolas, monospace;
    --sans:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--canvas);
    font: 14px/1.45 var(--sans);
    letter-spacing: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    background: var(--canvas);
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    color: inherit;
  }

  a {
    color: inherit;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1,
  h2 {
    text-wrap: balance;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
    }
  }
`;

const Shell = styled.main`
  width: min(1560px, calc(100vw - 32px));
  min-height: 100svh;
  margin: 0 auto;
  padding: 18px 0 22px;

  @media (max-width: 760px) {
    width: min(100vw - 20px, 760px);
    padding-top: 10px;
  }
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 10px 2px 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 7px;

  h1 {
    color: var(--ink);
    font-size: 30px;
    font-weight: 760;
    line-height: 1.1;
    letter-spacing: 0;
  }

  p {
    max-width: 660px;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.45;
    letter-spacing: 0;
    text-wrap: balance;
  }
`;

const BrandRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
`;

const LogoBadge = styled.span`
  width: 42px;
  height: 42px;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px oklch(0.5 0.098 185 / 0.1);
`;

const LogoMark = styled.svg`
  display: block;
  flex-shrink: 0;
`;

const BrandCopy = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

const Pill = styled.span`
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 0 12px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  font-weight: 800;
  white-space: nowrap;

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const Button = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 0 13px;
  color: var(--inverse-ink);
  background: var(--ink);
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 1px 2px oklch(0.2 0.033 255 / 0.18);
  transition-property: background-color, transform, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: var(--ink-hover);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const UrlBarPanel = styled.section`
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
`;

const UrlInput = styled.input`
  width: 100%;
  min-height: 52px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 0 14px;
  color: var(--ink);
  background: var(--field);
  font-family: var(--mono);
  font-size: 15px;
  letter-spacing: 0;
  outline: none;
  transition-property: border-color, box-shadow;
  transition-duration: 150ms;

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft);
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  color: var(--muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(390px, 0.9fr);
  gap: 14px;
  margin-top: 14px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const PrimaryColumn = styled.div`
  display: grid;
  gap: 14px;
  align-content: start;
`;

const SecondaryColumn = styled.aside`
  display: grid;
  gap: 14px;
  align-content: start;
`;

const WorkspacePanel = styled.section`
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 14px;
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
`;

const PanelHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: start;
  justify-content: space-between;

  h2 {
    color: var(--ink);
    font-size: 18px;
    line-height: 1.2;
    font-weight: 760;
    letter-spacing: 0;
  }
`;

const SectionKicker = styled.span`
  display: block;
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const AnatomyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

const FieldLabel = styled.label`
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0;
`;

const TextInput = styled.input`
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0 10px;
  color: var(--ink);
  background: var(--field);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0;
  outline: none;
  transition-property: border-color, box-shadow, background-color;
  transition-duration: 150ms;

  &:disabled {
    color: var(--subtle);
    background: var(--field-disabled);
    cursor: not-allowed;
  }

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const TextSelect = styled.select`
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0 34px 0 10px;
  color: var(--ink);
  background: var(--field);
  outline: none;
  transition-property: border-color, box-shadow;
  transition-duration: 150ms;

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const ReadoutBox = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border-radius: 7px;
  background: var(--panel-strong);
  box-shadow: inset 0 0 0 1px oklch(0.2 0.033 255 / 0.08);

  &[data-wide] {
    grid-column: 1 / -1;
  }
`;

const ReadoutLabel = styled.span`
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const ReadoutValue = styled.code`
  overflow: hidden;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.45;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyBox = styled.div`
  min-height: 74px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--muted);
  background: var(--panel-strong);
  box-shadow: inset 0 0 0 1px oklch(0.2 0.033 255 / 0.08);
`;

const RowsArea = styled.div`
  display: grid;
  gap: 7px;
  min-width: 0;
`;

const RowsHeader = styled.div`
  display: grid;
  grid-template-columns: 44px 46px minmax(130px, 1fr) minmax(130px, 1fr) 128px minmax(196px, auto);
  gap: 8px;
  padding: 0 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;

  @media (max-width: 900px) {
    display: none;
  }
`;

const RowsList = styled.div`
  display: grid;
  gap: 8px;
`;

const RowItem = styled.div`
  display: grid;
  grid-template-columns: 44px 46px minmax(130px, 1fr) minmax(130px, 1fr) 128px minmax(196px, auto);
  gap: 8px;
  align-items: center;
  min-width: 0;
  min-height: 54px;
  padding: 7px;
  border-radius: 8px;
  background: var(--panel-strong);
  box-shadow: inset 0 0 0 1px oklch(0.2 0.033 255 / 0.1);

  &[data-dragging] {
    box-shadow: 0 16px 30px oklch(0.2 0.033 255 / 0.16);
  }

  @media (max-width: 900px) {
    grid-template-columns: 44px 46px minmax(0, 1fr);
    align-items: start;
  }
`;

const DragHandle = styled.button`
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  color: var(--muted);
  background: var(--control);
  font-family: var(--mono);
  font-weight: 900;
  cursor: grab;
  transition-property: background-color, transform;
  transition-duration: 150ms;

  &:active {
    cursor: grabbing;
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
`;

const InlineInput = styled.input`
  min-width: 0;
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0 10px;
  color: var(--ink);
  background: var(--field);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0;
  outline: none;
  transition-property: border-color, box-shadow, background-color;
  transition-duration: 150ms;

  &:disabled {
    color: var(--subtle);
    background: var(--field-disabled);
  }

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 900px) {
    grid-column: 3;
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const InlineSelect = styled.select`
  min-width: 0;
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0 8px;
  color: var(--ink);
  background: var(--field);
  outline: none;

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 900px) {
    grid-column: 3;
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const RowActions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 44px);
  gap: 6px;
  justify-content: end;

  @media (max-width: 900px) {
    grid-column: 1 / -1;
    grid-template-columns: repeat(4, minmax(44px, 1fr));
    justify-content: stretch;
  }
`;

const IconButton = styled.button`
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  padding: 0 9px;
  color: var(--ink);
  background: var(--control);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition-property: background-color, transform, opacity;
  transition-duration: 150ms;

  &:hover:not(:disabled) {
    background: var(--control-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
`;

const DangerButton = styled(IconButton)`
  color: var(--red);
  background: var(--red-soft);
`;

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: 8px;
  background: var(--control);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const SegmentButton = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 7px;
  padding: 0 10px;
  color: var(--muted);
  background: transparent;
  font-weight: 800;
  cursor: pointer;
  transition-property: background-color, color, transform, box-shadow;
  transition-duration: 150ms;

  &[data-active] {
    color: var(--ink);
    background: var(--field);
    box-shadow: 0 1px 2px oklch(0.2 0.033 255 / 0.12);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  @media (max-width: 760px) {
    min-height: 44px;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const BooleanRow = styled.div`
  min-height: 44px;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-radius: 7px;
  background: var(--panel-strong);
  box-shadow: inset 0 0 0 1px oklch(0.2 0.033 255 / 0.08);
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
`;

const ToggleRoot = styled(Checkbox.Root)`
  position: relative;
  width: 44px;
  min-width: 44px;
  height: 44px;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition-property: background-color, transform;
  transition-duration: 150ms;

  &::before {
    content: "";
    position: absolute;
    top: 10px;
    right: 2px;
    left: 2px;
    height: 24px;
    border-radius: 999px;
    background: var(--line-strong);
    transition: background-color 150ms;
  }

  &[data-checked]::before {
    background: var(--accent);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
`;

const ToggleIndicator = styled(Checkbox.Indicator)`
  position: absolute;
  top: 14px;
  left: 6px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--field);
  box-shadow: 0 1px 2px oklch(0.2 0.033 255 / 0.25);
  transition-property: transform;
  transition-duration: 150ms;

  [data-checked] & {
    transform: translateX(16px);
  }
`;

const TabList = styled(Tabs.List)`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  padding: 4px;
  border-radius: 8px;
  background: var(--control);

  button {
    min-height: 40px;
    min-width: 44px;
    border: 0;
    border-radius: 7px;
    padding: 0 11px;
    color: var(--muted);
    background: transparent;
    font-weight: 800;
    cursor: pointer;
    transition-property: background-color, color, transform;
    transition-duration: 150ms;
  }

  button[data-selected] {
    color: var(--ink);
    background: var(--field);
    box-shadow: 0 1px 2px oklch(0.2 0.033 255 / 0.12);
  }

  button:active {
    transform: scale(0.96);
  }

  button:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  @media (max-width: 760px) {
    button {
      min-height: 44px;
    }
  }
`;

const OutputStack = styled.div`
  display: grid;
  gap: 10px;
`;

const CodeBlock = styled.pre`
  max-height: 360px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  color: var(--ink);
  background: var(--panel-strong);
  box-shadow: inset 0 0 0 1px oklch(0.2 0.033 255 / 0.08);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.55;
  letter-spacing: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const WarningList = styled.div`
  display: grid;
  gap: 7px;
`;

const Notice = styled.div`
  padding: 10px;
  border-radius: 8px;
  color: var(--blue);
  background: var(--blue-soft);
  font-size: 13px;
  font-weight: 700;

  &[data-severity="warning"] {
    color: var(--amber);
    background: var(--amber-soft);
  }

  &[data-severity="danger"] {
    color: var(--red);
    background: var(--red-soft);
  }
`;

const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
  padding: 16px 2px 0;
  color: var(--muted);
  font-size: 12px;
`;

const FooterLink = styled.a`
  color: var(--accent-strong);
  font-weight: 800;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export default App;
