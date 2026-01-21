from django.db import models

# Create your models here.
class Example(models.Model) :
    title = models.CharField(max_length=100)
    author = models.CharField(max_length=100)
    publication_date = models.DateField()
    price = models.IntegerField()

    class Meta:
        verbose_name = '예시 데이터'
        verbose_name_plural = '예시 목록'

    def __str__(self):
        return self.title