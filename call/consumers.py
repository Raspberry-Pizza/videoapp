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
        
        # receiving call
        if eventType == 'call':
            
            name = text_data_json['data']['name']
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

        # receiving call answer
        if eventType == 'answer_call':
            caller = text_data_json['data']['caller']
            async_to_sync(self.channel_layer.group_send)(
                caller,
                {
                    'type': 'call_answered',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )
        
        # receiving close call (Before call has been accepted)
        if eventType == 'close_call':
            name = text_data_json['data']['name']
            async_to_sync(self.channel_layer.group_send)(
                name,
                {
                    'type': 'end_call_received',
                    'data': {
                        'caller': self.my_name
                    }
                }
            )

        # receiving ICE candidates 
        if eventType == 'ICEcandidate':
            user = text_data_json['data']['user']
            async_to_sync(self.channel_layer.group_send)(
                user,
                {
                    'type': 'ICEcandidate',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )


    def call_received(self, event):
        self.send(text_data=json.dumps({
            'type': 'call_received',
            'data': event['data']
        }))

    def end_call_received(self, event):
        self.send(text_data=json.dumps({
            'type': 'end_call_received',
            'data': event['data']
        }))

    def call_answered(self, event):
        self.send(text_data=json.dumps({
            'type': 'call_answered',
            'data': event['data']
        }))

    def ICEcandidate(self, event):
        self.send(text_data=json.dumps({
            'type': 'ICEcandidate',
            'data': event['data']
        }))