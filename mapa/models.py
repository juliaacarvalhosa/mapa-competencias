from django.db import models


class Feedback(models.Model):
    ITEM_TYPES = (
        ('mapa', 'Mapa completo'),
        ('competencia', 'Competência'),
        ('material', 'Matéria-prima'),
        ('setor', 'Setor'),
    )

    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    item_key = models.CharField(max_length=160)
    item_title = models.CharField(max_length=255)
    name = models.CharField(max_length=120)
    add = models.TextField(blank=True)
    remove = models.TextField(blank=True)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [models.Index(fields=('item_type', 'item_key'))]

    def __str__(self):
        return f'{self.item_title} — {self.name}'


class MapCard(models.Model):
    item_type = models.CharField(max_length=20)
    item_key = models.CharField(max_length=160)
    data = models.JSONField(default=dict)
    is_new = models.BooleanField(default=False)
    created_by = models.CharField(max_length=120, blank=True)
    updated_by = models.CharField(max_length=120, blank=True)
    history = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=('item_type', 'item_key'), name='unique_map_card')]
        ordering = ('item_type', 'item_key')
