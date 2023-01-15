from django.db import models

# Create your models here.

'''
    1 - Create Model RoomMember |   Store username, UID and Room name
    2 - on Join, create RoomMemberin database
    3 - On handleUserJoin event, query DB for room member name by UID and Room name
    4 - On leave, delete Room member

    SUPERUSER DETAILS:
    username- krishna
    email- krishna@email.com
    password- 1234
'''

class RoomMember(models.Model):
    uid = models.CharField(max_length=300)
    name = models.CharField(max_length=300)
    room_name = models.CharField(max_length=300)

    def __str__(self):
        return self.name
    