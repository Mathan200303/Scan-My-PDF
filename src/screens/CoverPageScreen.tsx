import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GraduationCap,
  FileCheck,
  FilePlus2,
  FolderOpen,
  Sparkles,
  Smartphone,
  X,
  FileText,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CoverPageData, CoverTemplateType, DocumentItem } from '../types';
import { PdfService } from '../services/pdfService';
import { DocumentRepository } from '../storage/documentRepository';
import { FileService } from '../services/fileService';

export const CoverPageScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [template, setTemplate] = useState<CoverTemplateType>('academic');
  const [title, setTitle] = useState('Final Term Research Assignment');
  const [subtitle, setSubtitle] = useState('Distributed Computing & Cloud Architecture');
  const [studentName, setStudentName] = useState('Narmathan K.');
  const [studentId, setStudentId] = useState('ST-2026-8941');
  const [institution, setInstitution] = useState('Department of Computer Science');
  const [course, setCourse] = useState('B.Sc. Software Engineering');
  const [subject, setSubject] = useState('Mobile Systems (CS402)');
  const [lecturer, setLecturer] = useState('Dr. A. Richardson');
  const [date, setDate] = useState(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));

  const [loading, setLoading] = useState(false);
  const [targetPdf, setTargetPdf] = useState<DocumentItem | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handlePickFromPhone = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setLoading(true);
        try {
          const count = await PdfService.getPdfPageCount(file.uri);
          const size = file.size || (await FileService.getFileSizeBytes(file.uri));
          const doc: DocumentItem = {
            id: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: file.name.replace(/\.pdf$/i, ''),
            uri: file.uri,
            type: 'pdf',
            pageCount: count,
            fileSize: size,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTargetPdf(doc);
          setPickerVisible(false);
        } catch (err) {
          Alert.alert('Invalid PDF', 'Could not open or parse the selected PDF.');
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('File pick error', e);
    }
  };

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    setAvailableDocs(pdfs);
    setPickerVisible(true);
  };

  const handleGenerate = async (attachToExisting = false) => {
    if (!title.trim() || !studentName.trim()) {
      Alert.alert('Missing Fields', 'Please provide at least the Assignment Title and Student Name.');
      return;
    }

    setLoading(true);
    try {
      const coverData: CoverPageData = {
        template,
        title: title.trim(),
        subtitle: subtitle.trim(),
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        institution: institution.trim(),
        course: course.trim(),
        subject: subject.trim(),
        lecturer: lecturer.trim(),
        date: date.trim(),
      };

      let resultDoc: DocumentItem;

      if (attachToExisting && targetPdf) {
        // Prepend to target PDF
        const res = await PdfService.prependCoverPage(
          targetPdf.uri,
          coverData,
          `${targetPdf.title}_WithCover`
        );

        resultDoc = {
          id: `doc_${Date.now()}`,
          title: `${targetPdf.title} (With Cover)`,
          uri: res.uri,
          type: 'pdf',
          pageCount: res.pageCount,
          fileSize: res.fileSize,
          thumbnailUri: targetPdf.thumbnailUri,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Standalone cover page
        const res = await PdfService.generateCoverPage(
          coverData,
          `${FileService.sanitizeFileName(title)}_Cover`
        );

        resultDoc = {
          id: `doc_${Date.now()}`,
          title: `${title} - Cover Page`,
          uri: res.uri,
          type: 'pdf',
          pageCount: 1,
          fileSize: res.fileSize,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      await DocumentRepository.save(resultDoc);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: resultDoc });
    } catch (e: any) {
      setLoading(false);
      console.error('Cover generation error', e);
      Alert.alert('Error', e?.message || 'Could not generate cover page.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Assignment Cover Page" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
      >
        {/* Template Selector */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TEMPLATE DESIGN</Text>
        <View style={styles.templateRow}>
          {(['academic', 'modern'] as CoverTemplateType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTemplate(t)}
              style={[
                styles.templateCard,
                {
                  backgroundColor: colors.card,
                  borderColor: template === t ? colors.primary : colors.border,
                  borderWidth: template === t ? 2 : 1,
                },
              ]}
            >
              <GraduationCap
                size={22}
                color={template === t ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.templateName,
                  { color: template === t ? colors.primary : colors.text },
                ]}
              >
                {t === 'academic' ? 'Classic Academic' : 'Modern Clean'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Fields */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          COVER DETAILS
        </Text>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Assignment Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Distributed Computing Report"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Subtitle (Optional)</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Analysis of Cloud Workloads"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Student Name *</Text>
          <TextInput
            value={studentName}
            onChangeText={setStudentName}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Student ID</Text>
          <TextInput
            value={studentId}
            onChangeText={setStudentId}
            placeholder="e.g. ST-2026-001"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Institution / University</Text>
          <TextInput
            value={institution}
            onChangeText={setInstitution}
            placeholder="University or College Name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Course / Degree</Text>
          <TextInput
            value={course}
            onChangeText={setCourse}
            placeholder="e.g. Computer Science"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Subject / Module</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. CS402 Mobile Systems"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Lecturer / Supervisor</Text>
          <TextInput
            value={lecturer}
            onChangeText={setLecturer}
            placeholder="Lecturer's name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Submission Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="Date string"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        {/* Attach Option */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          TARGET DOCUMENT (OPTIONAL)
        </Text>

        {targetPdf ? (
          <View style={[styles.selectedDocCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={[styles.docIconBox, { backgroundColor: colors.primaryLight }]}>
              <FileText size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={[styles.selectedDocTitle, { color: colors.text }]} numberOfLines={1}>
                {targetPdf.title}
              </Text>
              <Text style={[styles.selectedDocMeta, { color: colors.textSecondary }]}>
                {targetPdf.pageCount} pages • {FileService.formatFileSize(targetPdf.fileSize)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setTargetPdf(null)} style={styles.removeDocBtn}>
              <X size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dualPickerRow}>
            <TouchableOpacity
              onPress={handlePickFromPhone}
              style={[styles.pickBtnHalf, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            >
              <Smartphone size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.pickBtnText, { color: colors.primary }]}>Phone Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenPicker}
              style={[styles.pickBtnHalf, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <FolderOpen size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.pickBtnText, { color: colors.text }]}>App Scans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.actionsContainer}>
          {targetPdf ? (
            <TouchableOpacity
              onPress={() => handleGenerate(true)}
              style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            >
              <FileCheck size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.mainBtnText}>Attach Cover & Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleGenerate(false)}
              style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            >
              <FilePlus2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.mainBtnText}>Generate Standalone Cover PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Target PDF Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Target PDF</Text>

            {/* Direct Phone Storage Button at top of modal */}
            <TouchableOpacity
              onPress={handlePickFromPhone}
              style={[styles.modalPhoneBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            >
              <Smartphone size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.modalPhoneBtnText, { color: colors.primary }]}>
                Browse Phone Storage (Downloads / Files)
              </Text>
            </TouchableOpacity>

            <Text style={[styles.modalSubheading, { color: colors.textSecondary }]}>
              OR SELECT FROM APP SCANS:
            </Text>

            {availableDocs.length > 0 ? (
              <FlatList
                data={availableDocs}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 220 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setTargetPdf(item);
                      setPickerVisible(false);
                    }}
                    style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                  >
                    <FileText size={16} color={colors.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerTitleText, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.pickerMetaText, { color: colors.textSecondary }]}>
                        {item.pageCount} pages • {FileService.formatFileSize(item.fileSize)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyScansBox}>
                <Text style={[styles.emptyScansText, { color: colors.textMuted }]}>
                  No scanned documents in app yet.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <LoadingOverlay visible={loading} message="Generating Cover Page..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  templateCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
  },
  attachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  attachText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: Spacing.xl,
  },
  mainBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: Spacing.xl,
    zIndex: 10,
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  pickerRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  pickerTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  dualPickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pickBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDocTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedDocMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  removeDocBtn: {
    padding: Spacing.xs,
  },
  modalPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  modalPhoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubheading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  pickerMetaText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyScansBox: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyScansText: {
    fontSize: 12,
  },
});

