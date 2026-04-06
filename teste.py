import paho.mqtt.client as mqtt

# Função chamada quando a conexão for bem-sucedida
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectado com sucesso ao broker MQTT!")
        # Exemplo: se quiser se inscrever em um tópico
        client.subscribe("REC/TI1337")
    else:
        print(f"Falha na conexão. Código de retorno: {rc}")

# Função chamada quando uma nova mensagem chega
def on_message(client, userdata, msg):
    print(f"Mensagem recebida no tópico {msg.topic}: {msg.payload.decode()}")

# Criação do cliente MQTT
client = mqtt.Client()

# Configura os callbacks
client.on_connect = on_connect
client.on_message = on_message

# Conecta ao broker
client.connect("172.16.107.8", 1883, 60)

# Mantém o loop ativo
client.loop_forever()