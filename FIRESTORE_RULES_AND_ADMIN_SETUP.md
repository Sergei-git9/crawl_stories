# Firestore rules & admin setup — пример и инструкция

Ниже — пример набора правил безопасности для Firestore и инструкция, как создать админов, чтобы только доверённые аккаунты могли менять глобальные настройки (`settings/theme`) и другие защищённые коллекции.

---

## Пример правил Firestore (firestore.rules)

Сохраните этот файл и примените через Firebase Console → Rules или `firebase deploy --only firestore:rules`.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Admins: документы с ID = UID администратора
    match /admins/{adminId} {
      allow read: if true; // публично читаемые (опционально)
      // Изменять можно только аутентифицированным администраторам (вложенная проверка)
      allow write: if request.auth != null && request.auth.uid == adminId && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Settings: только админы могут писать
    match /settings/{docId} {
      allow read: if true; // публично читаемые
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Stories: публичное чтение, запись — только админы
    match /stories/{storyId} {
      allow read: if resource.data.isPublic != false && (resource.data.published == true || resource.data.publishDate <= request.time);
      allow create, update, delete: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Episodes: публичное чтение только для опубликованных эпизодов
    match /episodes/{episodeId} {
      allow read: if get(/databases/$(database)/documents/episodes/$(episodeId)).data.status == 'published' || get(/databases/$(database)/documents/episodes/$(episodeId)).data.publishDate <= request.time;
      allow create, update, delete: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Episode messages: чтение разрешено если эпизод опубликован; запись — только админам
    match /episode_messages/{msgId} {
      allow read: if resource.data.episodeId != null && (
        get(/databases/$(database)/documents/episodes/$(resource.data.episodeId)).data.status == 'published' ||
        get(/databases/$(database)/documents/episodes/$(resource.data.episodeId)).data.publishDate <= request.time
      );
      allow create, update, delete: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Story characters: читаем для всех, пишем только админам
    match /story_characters/{charId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // По умолчанию запрет для всего остального
    match /{document=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

Примечания:
- `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` — проверка наличия документа администратора; предполагается, что вы создадите коллекцию `admins` и добавите туда пользователей с id = UID.
- `request.time` — время запроса, используется для сравнения с `publishDate`.
- Правила выше — пример; адаптируйте в зависимости от полей в ваших документах (например, `status`, `published`, `isPublic`, `publishDate`).

## Индексы (рекомендации)

Через Firebase Console → Indexes создайте:
- Composite index на `episodes` по `storyId` (asc) + `episodeNumber` (asc) — нужен для запроса эпизодов истории в правильном порядке.
- Composite index на `episode_messages` по `episodeId` (asc) + `order` (asc) — для упорядоченного чтения сообщений эпизода.

Если вы используете `firebase.json` / `firestore.indexes.json`, добавьте соответствующие записи туда.

## Инструкция: создать администратора (ручной способ через Firebase Console)

1. Откройте Firebase Console → Authentication → Users → Add user.
   - Введите Email и Password для администратора.
2. Запишите UID созданного пользователя (в списке пользователей кликните по пользователю, там есть `UID`).
3. Откройте Firestore → Вручную создайте коллекцию `admins`.
   - Создайте документ с ID = UID (из шага 2).
   - В документа добавьте поля, например:
     - `email`: admin@example.com
     - `role`: `owner` (или `editor`)
     - `createdAt`: серверное время (можно задать в UI как метку или оставить пустым)

После этого пользователь сможет аутентифицироваться (в админке) и его UID будет распознаваться правилами.

## Альтернативный способ: создать администратора программно (Node.js с Admin SDK)

Скрипт для создания документа `admins/{uid}` используя Firebase Admin SDK:

```js
// npm i firebase-admin
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function addAdmin(uid, email) {
  await db.collection('admins').doc(uid).set({ email, role: 'owner', createdAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('Admin added:', uid);
}

addAdmin('UID_FROM_AUTH', 'admin@example.com').catch(console.error);
```

Замечание: чтобы создать самого пользователя (аутентификацию email/password) программно, используйте Firebase Admin SDK `admin.auth().createUser({email, password})`.

## Проверка и тестирование

1. Создайте тестового админа (см. выше).
2. Откройте `admin.html`, выполните вход через Firebase Auth (в текущей реализации используется prompt или можно будет заменить на форму).
3. Попробуйте сохранить тему: если вы залогинены как админ — изменения будут записаны в `settings/theme` в Firestore; если нет — изменения сохранятся локально в `localStorage`.
4. Проверьте, что пользователь без записи в `admins` не может записать `settings/theme` (попробуйте через UI, затем проверьте консоль/правила и логи Firestore).

## Примечания по безопасности

- Не храните секреты/пароли в клиентском JS.
- Управление учётными записями (создание админов) лучше делать из trusted environment (сервер или Cloud Function) и только через аутентику/админ SDK.
- Правила в `firestore.rules` должны быть минимально привилегированными и покрывать все чувствительные коллекции (например, `admins`, `settings`, `stories` и т.д.).

---

Если хотите, могу:
- Сгенерировать `firestore.rules` файл в репозитории и предложить `firestore.indexes.json` для копирования в ваш `firebase.json`.
- Реализовать форму входа в `admin.html` вместо prompt (следующим шагом), и live-превью интенсивности.

Готов двигаться дальше по вашему желанию.
