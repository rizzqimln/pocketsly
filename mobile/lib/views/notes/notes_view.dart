import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';

class NotesView extends StatefulWidget {
  const NotesView({super.key});

  @override
  State<NotesView> createState() => _NotesViewState();
}

class _NotesViewState extends State<NotesView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<NoteItem> _notes = [];
  List<ResourceItem> _resources = [];

  // Filter & Search states
  String _notesSearch = '';
  String _selectedMood = 'all';

  String _librarySearch = '';
  String _selectedCategory = 'all';

  final List<String> _moods = ['all', 'productive', 'happy', 'neutral', 'tired', 'stressed'];
  final List<String> _categories = ['all', 'general', 'frontend', 'backend', 'book', 'journal'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadNotesAndLibrary();
  }

  Future<void> _loadNotesAndLibrary() async {
    setState(() => _isLoading = true);
    try {
      final nRes = await ApiClient.instance.get(ApiEndpoints.notes);
      final rRes = await ApiClient.instance.get(ApiEndpoints.resources);

      if (mounted) {
        if (nRes is List) _notes = nRes.map((n) => NoteItem.fromJson(n)).toList();
        if (rRes is List) _resources = rRes.map((r) => ResourceItem.fromJson(r)).toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Color _getMoodColor(String mood) {
    switch (mood.toLowerCase()) {
      case 'productive':
        return AppColors.primaryLight;
      case 'happy':
        return AppColors.success;
      case 'stressed':
        return AppColors.danger;
      case 'tired':
        return AppColors.warning;
      case 'neutral':
      default:
        return AppColors.info;
    }
  }

  String _getMoodLabel(String mood) {
    switch (mood.toLowerCase()) {
      case 'productive':
        return 'Productive';
      case 'happy':
        return 'Positive';
      case 'stressed':
        return 'Urgent';
      case 'tired':
        return 'Review Later';
      case 'neutral':
      default:
        return 'General';
    }
  }

  // ── Note Editor Dialog ────────────────────────────────────────────────────
  void _openNoteEditor([NoteItem? note]) {
    final isNew = note == null;
    final titleController = TextEditingController(text: note?.title ?? '');
    final bodyController = TextEditingController(text: note?.content ?? '');
    String currentMood = note?.mood ?? 'neutral';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            final text = bodyController.text;
            final wordCount = text.trim().isEmpty ? 0 : text.trim().split(RegExp(r'\s+')).length;
            final charCount = text.length;

            return Padding(
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 12,
                bottom: bottomInset + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.borderLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isNew ? 'New Note / Reflection' : 'Edit Note',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        '$wordCount words • $charCount chars',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title Input & Mood Dropdown
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: titleController,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                          decoration: const InputDecoration(
                            hintText: 'Untitled Reflection / Note',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.bgSurfaceAlt,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: currentMood,
                            dropdownColor: AppColors.bgSurfaceAlt,
                            items: const [
                              DropdownMenuItem(value: 'neutral', child: Text('General', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'productive', child: Text('Productive', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'happy', child: Text('Positive', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'tired', child: Text('Review Later', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'stressed', child: Text('Urgent', style: TextStyle(fontSize: 12))),
                            ],
                            onChanged: (val) {
                              if (val != null) setSheetState(() => currentMood = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Body Input
                  TextField(
                    controller: bodyController,
                    maxLines: 8,
                    onChanged: (_) => setSheetState(() {}),
                    decoration: const InputDecoration(
                      hintText: 'Start writing... your thoughts, class notes, reflections, or ideas.',
                      contentPadding: EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Action Buttons
                  Row(
                    children: [
                      if (!isNew) ...[
                        IconButton.filled(
                          onPressed: () async {
                            Navigator.pop(ctx);
                            await ApiClient.instance.delete(ApiEndpoints.note(note.id));
                            _loadNotesAndLibrary();
                          },
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.danger.withAlpha(40),
                          ),
                          icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger, size: 20),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final title = titleController.text.trim();
                            final content = bodyController.text.trim();
                            if (title.isEmpty && content.isEmpty) return;

                            Navigator.pop(ctx);
                            final today = DateTime.now().toIso8601String().substring(0, 10);

                            if (isNew) {
                              await ApiClient.instance.post(ApiEndpoints.notes, {
                                'title': title.isEmpty ? 'Untitled Note' : title,
                                'content': content,
                                'mood': currentMood,
                                'tags': currentMood,
                                'updated_at': today,
                              });
                            } else {
                              await ApiClient.instance.post(ApiEndpoints.note(note.id), {
                                'title': title.isEmpty ? 'Untitled Note' : title,
                                'content': content,
                                'mood': currentMood,
                                'tags': currentMood,
                                'updated_at': today,
                              });
                            }
                            _loadNotesAndLibrary();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.save_outlined, size: 18),
                          label: Text(isNew ? 'Save Note' : 'Update Note', style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ── Add Academic Resource Dialog ──────────────────────────────────────────
  void _openAddResourceModal() {
    final titleController = TextEditingController();
    final authorController = TextEditingController();
    final urlController = TextEditingController();
    final summaryController = TextEditingController();
    String currentCategory = 'frontend';
    String currentType = 'article';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            return Padding(
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 12,
                bottom: bottomInset + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.borderLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Add Research Resource / Book',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'Title / Paper Name'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: authorController,
                          decoration: const InputDecoration(labelText: 'Author / Publisher'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.bgSurfaceAlt,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: currentCategory,
                            dropdownColor: AppColors.bgSurfaceAlt,
                            items: const [
                              DropdownMenuItem(value: 'frontend', child: Text('Frontend')),
                              DropdownMenuItem(value: 'backend', child: Text('Backend')),
                              DropdownMenuItem(value: 'general', child: Text('General')),
                              DropdownMenuItem(value: 'book', child: Text('Book')),
                              DropdownMenuItem(value: 'journal', child: Text('Journal')),
                            ],
                            onChanged: (val) {
                              if (val != null) setSheetState(() => currentCategory = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: urlController,
                    decoration: const InputDecoration(labelText: 'URL / Online Reference Link'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: summaryController,
                    maxLines: 2,
                    decoration: const InputDecoration(labelText: 'Key Takeaways / Abstract Summary'),
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: () async {
                      final title = titleController.text.trim();
                      if (title.isEmpty) return;

                      Navigator.pop(ctx);
                      await ApiClient.instance.post(ApiEndpoints.resources, {
                        'title': title,
                        'author': authorController.text.trim(),
                        'url': urlController.text.trim(),
                        'summary': summaryController.text.trim(),
                        'category': currentCategory,
                        'type': currentType,
                      });
                      _loadNotesAndLibrary();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add to Academic Library', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredNotes = _notes.where((n) {
      final matchesSearch = _notesSearch.isEmpty ||
          n.title.toLowerCase().contains(_notesSearch.toLowerCase()) ||
          n.content.toLowerCase().contains(_notesSearch.toLowerCase());
      final matchesMood = _selectedMood == 'all' || n.mood.toLowerCase() == _selectedMood.toLowerCase();
      return matchesSearch && matchesMood;
    }).toList();

    final filteredResources = _resources.where((r) {
      final matchesSearch = _librarySearch.isEmpty ||
          r.title.toLowerCase().contains(_librarySearch.toLowerCase()) ||
          r.author.toLowerCase().contains(_librarySearch.toLowerCase()) ||
          r.summary.toLowerCase().contains(_librarySearch.toLowerCase());
      final matchesCategory = _selectedCategory == 'all' || r.category.toLowerCase() == _selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    }).toList();

    return Column(
      children: [
        // ── Main Tab Bar ────────────────────────────────────────────────────
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabController,
            indicatorSize: TabBarIndicatorSize.tab,
            indicator: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(10),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: AppColors.textSecondary,
            dividerColor: Colors.transparent,
            tabs: const [
              Tab(text: 'Journal & Notes'),
              Tab(text: 'Academic Library'),
            ],
          ),
        ),

        // ── Tab Views ───────────────────────────────────────────────────────
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // ═════════════════════════════════════════════════════════
                    // TAB 1: JOURNAL & NOTES PANE
                    // ═════════════════════════════════════════════════════════
                    RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: _loadNotesAndLibrary,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Search bar & New note action
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  onChanged: (val) => setState(() => _notesSearch = val),
                                  decoration: InputDecoration(
                                    hintText: 'Search notes by title or content...',
                                    prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                    filled: true,
                                    fillColor: AppColors.bgSurfaceAlt,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton.filled(
                                onPressed: () => _openNoteEditor(),
                                style: IconButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: const EdgeInsets.all(12),
                                ),
                                icon: const Icon(Icons.add_rounded, color: Colors.white),
                                tooltip: 'New Note',
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Mood Filter Chips
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _moods.map((m) {
                                final isSelected = _selectedMood == m;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    label: Text(_getMoodLabel(m)),
                                    selected: isSelected,
                                    selectedColor: AppColors.primary,
                                    backgroundColor: AppColors.bgSurfaceAlt,
                                    labelStyle: TextStyle(
                                      color: isSelected ? Colors.white : AppColors.textSecondary,
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    ),
                                    side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                                    onSelected: (_) => setState(() => _selectedMood = m),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Notes List
                          if (filteredNotes.isEmpty)
                            GlassCard(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.edit_note_rounded, color: AppColors.textMuted.withAlpha(100), size: 48),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No notes found.',
                                    style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Capture your class reflections, insights, or code ideas.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  ),
                                  const SizedBox(height: 14),
                                  ElevatedButton.icon(
                                    onPressed: () => _openNoteEditor(),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                    icon: const Icon(Icons.add_rounded, size: 16),
                                    label: const Text('Create First Note', style: TextStyle(fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...filteredNotes.map((n) {
                              final moodColor = _getMoodColor(n.mood);
                              return GlassCard(
                                margin: const EdgeInsets.only(bottom: 10),
                                onTap: () => _openNoteEditor(n),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            n.title.isEmpty ? 'Untitled Note' : n.title,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: moodColor.withAlpha(35),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: moodColor.withAlpha(80)),
                                          ),
                                          child: Text(
                                            _getMoodLabel(n.mood),
                                            style: TextStyle(color: moodColor, fontSize: 10, fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      n.content,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.3),
                                    ),
                                    if (n.updatedAt.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        'Updated: ${n.updatedAt}',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),

                    // ═════════════════════════════════════════════════════════
                    // TAB 2: ACADEMIC LIBRARY PANE
                    // ═════════════════════════════════════════════════════════
                    RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: _loadNotesAndLibrary,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Search bar & Add Resource action
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  onChanged: (val) => setState(() => _librarySearch = val),
                                  decoration: InputDecoration(
                                    hintText: 'Search title, author, journal...',
                                    prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                    filled: true,
                                    fillColor: AppColors.bgSurfaceAlt,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton.filled(
                                onPressed: _openAddResourceModal,
                                style: IconButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: const EdgeInsets.all(12),
                                ),
                                icon: const Icon(Icons.add_rounded, color: Colors.white),
                                tooltip: 'Add Paper / Book',
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Category Filter Chips
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _categories.map((c) {
                                final isSelected = _selectedCategory == c;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    label: Text(c.toUpperCase()),
                                    selected: isSelected,
                                    selectedColor: AppColors.primary,
                                    backgroundColor: AppColors.bgSurfaceAlt,
                                    labelStyle: TextStyle(
                                      color: isSelected ? Colors.white : AppColors.textSecondary,
                                      fontSize: 10,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    ),
                                    side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                                    onSelected: (_) => setState(() => _selectedCategory = c),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Resources List
                          if (filteredResources.isEmpty)
                            GlassCard(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.menu_book_rounded, color: AppColors.textMuted.withAlpha(100), size: 48),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No academic resources found.',
                                    style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Catalog research papers, documentation, and online textbooks.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  ),
                                  const SizedBox(height: 14),
                                  ElevatedButton.icon(
                                    onPressed: _openAddResourceModal,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                    icon: const Icon(Icons.add_rounded, size: 16),
                                    label: const Text('Add First Resource', style: TextStyle(fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...filteredResources.map((r) {
                              return GlassCard(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            r.title,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withAlpha(40),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            r.category.toUpperCase(),
                                            style: const TextStyle(color: AppColors.primaryLight, fontSize: 9, fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (r.author.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        'Author: ${r.author}',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                      ),
                                    ],
                                    if (r.summary.isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        r.summary,
                                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                      ),
                                    ],
                                    if (r.url.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        r.url,
                                        style: const TextStyle(color: AppColors.info, fontSize: 11, decoration: TextDecoration.underline),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}
