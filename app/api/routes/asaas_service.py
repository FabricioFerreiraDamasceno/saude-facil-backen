import httpx
import os
from typing import Dict, Any
from datetime import datetime

# Configurações do ASAAS
ASAAS_API_KEY = os.getenv("ASAAS_API_KEY", "")
ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3"
ASAAS_PRODUCTION_URL = "https://api.asaas.com/api/v3"

# Use sandbox por enquanto
ASAAS_BASE_URL = ASAAS_SANDBOX_URL

async def create_asaas_payment(payment_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Criar pagamento no ASAAS
    """
    print(f"📦 Criando pagamento ASAAS: {payment_data}")
    
    # Validação da API Key
    if not ASAAS_API_KEY or ASAAS_API_KEY == "api_key_aqui":
        print("⚠️ API Key do ASAAS não configurada. Usando modo simulado.")
        # Retorna simulação se não tiver API key
        return {
            "id": f"pay_{int(datetime.now().timestamp())}",
            "status": "PENDING",
            "payment_url": "https://sandbox.asaas.com/payment/simulated",
            "invoice_url": "https://sandbox.asaas.com/invoice/simulated",
            "amount": payment_data.get("amount", 0),
            "due_date": datetime.now().strftime("%Y-%m-%d"),
            "message": "Modo simulado - Configure ASAAS_API_KEY no .env"
        }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Prepara os dados para o ASAAS
            asaas_payload = {
                "customer": payment_data.get("customer_id"),
                "billingType": payment_data.get("billing_type", "UNDEFINED"),
                "value": payment_data.get("amount"),
                "dueDate": payment_data.get("due_date", datetime.now().strftime("%Y-%m-%d")),
                "description": payment_data.get("description", "Consulta Médica"),
                "externalReference": payment_data.get("order_id", ""),
                "postbackUrl": payment_data.get("webhook_url", "https://http://localhost:8081/payments/webhooks/asaas")
            }
            
            # Remove campos None
            asaas_payload = {k: v for k, v in asaas_payload.items() if v is not None}
            
            print(f"📤 Enviando para ASAAS: {asaas_payload}")
            
            response = await client.post(
                f"{ASAAS_BASE_URL}/payments",
                headers={
                    "access_token": ASAAS_API_KEY,
                    "Content-Type": "application/json",
                    "User-Agent": "SaudeFacil-App/1.0"
                },
                json=asaas_payload
            )
            
            # Verifica se a requisição foi bem sucedida
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ Pagamento criado com sucesso: {result.get('id')}")
            
            # Formata a resposta para o frontend
            return {
                "id": result.get("id"),
                "status": result.get("status"),
                "payment_url": result.get("invoiceUrl") or result.get("bankSlipUrl"),
                "invoice_url": result.get("invoiceUrl"),
                "amount": result.get("value"),
                "due_date": result.get("dueDate"),
                "billing_type": result.get("billingType"),
                "customer_id": result.get("customer")
            }
            
    except httpx.HTTPStatusError as e:
        print(f"❌ Erro HTTP ao criar pagamento: {e.response.status_code}")
        print(f"Resposta: {e.response.text}")
        raise Exception(f"Erro no ASAAS: {e.response.text}")
        
    except httpx.RequestError as e:
        print(f"❌ Erro de conexão com ASAAS: {str(e)}")
        raise Exception(f"Erro de conexão: Não foi possível conectar ao ASAAS")
        
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        raise Exception(f"Erro ao processar pagamento: {str(e)}")


async def process_webhook(webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processar webhook do ASAAS
    """
    try:
        event = webhook_data.get("event")
        payment = webhook_data.get("payment", {})
        payment_id = payment.get("id")
        
        print(f"🔄 Webhook recebido do ASAAS")
        print(f"Evento: {event}")
        print(f"Payment ID: {payment_id}")
        print(f"Status: {payment.get('status')}")
        
        # Mapeamento de status do ASAAS para seu sistema
        status_map = {
            "PENDING": "pending",
            "RECEIVED": "paid",
            "CONFIRMED": "paid",
            "OVERDUE": "overdue",
            "REFUNDED": "refunded",
            "CANCELLED": "cancelled",
            "REJECTED": "failed"
        }
        
        internal_status = status_map.get(payment.get("status"), "unknown")
        
        # Aqui você atualiza o pedido no banco de dados
        # Exemplo:
        # await db.orders.update_one(
        #     {"payment_id": payment_id},
        #     {
        #         "$set": {
        #             "status": internal_status,
        #             "payment_status": payment.get("status"),
        #             "updated_at": datetime.now()
        #         }
        #     }
        # )
        
        # Retorna confirmação
        return {
            "received": True,
            "event": event,
            "payment_id": payment_id,
            "status": internal_status
        }
        
    except Exception as e:
        print(f"❌ Erro ao processar webhook: {str(e)}")
        raise Exception(f"Erro no webhook: {str(e)}")


# Função auxiliar para criar um cliente no ASAAS
async def create_asaas_customer(customer_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Criar um cliente no ASAAS
    """
    if not ASAAS_API_KEY or ASAAS_API_KEY == "api_key_aqui":
        return {
            "id": f"cus_{int(datetime.now().timestamp())}",
            "name": customer_data.get("name"),
            "email": customer_data.get("email")
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ASAAS_BASE_URL}/customers",
                headers={
                    "access_token": ASAAS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "name": customer_data.get("name"),
                    "email": customer_data.get("email"),
                    "cpfCnpj": customer_data.get("cpf"),
                    "phone": customer_data.get("phone"),
                    "mobilePhone": customer_data.get("mobile_phone")
                }
            )
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"❌ Erro ao criar cliente no ASAAS: {str(e)}")
        raise Exception(f"Erro ao criar cliente: {str(e)}")