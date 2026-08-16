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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // ── Notes List Tab ──────────────────────────────────────
                    _notes.isEmpty
                        ? const Center(child: Text('No notes created yet.', style: TextStyle(color: AppColors.textMuted)))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _notes.length,
                            itemBuilder: (context, index) {
                              final n = _notes[index];
                              return GlassCard(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      n.title.isEmpty ? 'Untitled Note' : n.title,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      n.content,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),

                    // ── Academic Resource Library Tab ────────────────────────
                    _resources.isEmpty
                        ? const Center(child: Text('No academic resources loaded.', style: TextStyle(color: AppColors.textMuted)))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _resources.length,
                            itemBuilder: (context, index) {
                              final r = _resources[index];
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
                                            color: AppColors.primary.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            r.category.toUpperCase(),
                                            style: const TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Author: ${r.author}',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      r.summary,
                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ],
                ),
        ),
      ],
    );
  }
}
