import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer



class CallConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()

        # response to client, that we are connected.
        self.send(text_data=json.dumps({
            'type': 'connection',
            'data': {
                'message': "Connected"
            }
        }))

    
    def disconnect(self, close_code):
        print('I am disconnected')


    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        eventType = text_data_json['type']

        if eventType == 'login':
            name = text_data_json['data']['name']

            # we will use this as room name as well
            self.my_name = name

            # Join room
            async_to_sync(self.channel_layer.group_add)(
                self.my_name,
                self.channel_name
            )
            
        if eventType == 'call':
            
            name = text_data_json['data']['name']
            print('calling is success')
            async_to_sync(self.channel_layer.group_send)(
                name,
                {
                    'type': 'call_received',
                    'data': {
                        'caller': self.my_name,
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )


    def call_received(self, event):
        print('Call received by')
        self.send(text_data=json.dumps({
            'type': 'call_received',
            'data': event['data']
        }))