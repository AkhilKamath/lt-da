/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/linktree.json`.
 */
export type Linktree = {
  "address": "6jnvkMV423aCV52ieVPpfXwj3oWR8wKbR275pjNKdvgZ",
  "metadata": {
    "name": "linktree",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addLinks",
      "discriminator": [
        116,
        86,
        100,
        46,
        223,
        210,
        178,
        75
      ],
      "accounts": [
        {
          "name": "linktreeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "username"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        },
        {
          "name": "urls",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "titles",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "createLinktreeAccount",
      "discriminator": [
        104,
        38,
        42,
        26,
        176,
        17,
        90,
        218
      ],
      "accounts": [
        {
          "name": "linktreeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "username"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        }
      ]
    },
    {
      "name": "deleteLinks",
      "discriminator": [
        234,
        215,
        247,
        80,
        170,
        240,
        251,
        116
      ],
      "accounts": [
        {
          "name": "linktreeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "username"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        },
        {
          "name": "linkIds",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "deleteLinktreeAccount",
      "discriminator": [
        157,
        7,
        7,
        42,
        119,
        243,
        97,
        231
      ],
      "accounts": [
        {
          "name": "linktreeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "username"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "linkTreeAccount",
      "discriminator": [
        66,
        15,
        11,
        164,
        121,
        64,
        218,
        198
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "lengthInputsNotSame",
      "msg": "Number of urls and titles must be same"
    }
  ],
  "types": [
    {
      "name": "link",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "url",
            "type": "string"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "linkTreeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "links",
            "type": {
              "vec": {
                "defined": {
                  "name": "link"
                }
              }
            }
          },
          {
            "name": "linkCounter",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
